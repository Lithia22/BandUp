from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.config import supabase
from app.services.rag import rag_generate_feedback

router = APIRouter()


@router.get("/sets")
def get_sets():
    try:
        result = (
            supabase.table("questions")
            .select("set_number, year")
            .eq("component", "reading")
            .execute()
        )
        seen = {}
        for row in result.data:
            sn = row["set_number"]
            if sn not in seen:
                seen[sn] = row["year"]
        sets = [
            {
                "set_number": sn,
                "year": year,
                "label": f"Practice Set {sn} ({year})",
                "total_questions": 40,
            }
            for sn, year in sorted(seen.items())
        ]
        return {"sets": sets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sets/{set_number}")
def get_set_questions(set_number: int):
    try:
        result = (
            supabase.table("questions")
            .select("id, part_number, question_number, passage_title, passage, question_text, options")
            .eq("component", "reading")
            .eq("set_number", set_number)
            .order("question_number")
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Set not found")
        return {"set_number": set_number, "questions": result.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SubmitRequest(BaseModel):
    set_number: int
    answers: dict
    student_id: Optional[str] = None
    start_time: Optional[str] = None


@router.post("/submit")
def submit_answers(data: SubmitRequest):
    try:
        # 1. Fetch correct answers
        result = (
            supabase.table("questions")
            .select("id, question_number, part_number, question_text, correct_answer")
            .eq("component", "reading")
            .eq("set_number", data.set_number)
            .order("question_number")
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Set not found")

        questions = result.data
        now = datetime.now(timezone.utc).isoformat()

        # 2. Mark answers
        results = []
        correct_count = 0
        wrong_questions = []

        for q in questions:
            qid = q["id"]
            student_ans = data.answers.get(qid, None)
            correct_ans = q["correct_answer"]
            is_correct = student_ans == correct_ans
            if is_correct:
                correct_count += 1
            else:
                wrong_questions.append({
                    "question_number": q["question_number"],
                    "part_number": q["part_number"],
                    "question_text": q["question_text"],
                    "student_answer": student_ans,
                    "correct_answer": correct_ans,
                })
            results.append({
                "question_id": qid,
                "question_number": q["question_number"],
                "student_answer": student_ans,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
            })

        total = len(questions)

        # 3. Build performance summary for RAG
        wrong_summary = ""
        for wq in wrong_questions[:10]:
            wrong_summary += (
                f"- Q{wq['question_number']} (Part {wq['part_number']}): "
                f"{wq['question_text']} "
                f"[Student answered: {wq['student_answer'] or 'No answer'}, "
                f"Correct: {wq['correct_answer']}]\n"
            )

        part_errors = {}
        for wq in wrong_questions:
            p = wq["part_number"]
            part_errors[p] = part_errors.get(p, 0) + 1
        part_error_str = ", ".join([f"Part {p}: {c} wrong" for p, c in sorted(part_errors.items())])

        skipped_count = sum(1 for r in results if not r["student_answer"])

        performance_summary = f"""Student completed MUET Reading practice test (Set {data.set_number}).
Score: {correct_count} out of {total} questions correct ({round(correct_count/total*100,1)}%).
Skipped (no answer): {skipped_count} questions.
Wrong answer distribution by part: {part_error_str if part_error_str else 'None'}.
Sample wrong questions:
{wrong_summary if wrong_summary else 'All questions answered correctly.'}
Identify the student's reading comprehension level according to the MUET band descriptors."""

        # 4. RAG: embed → KNN → LLM
        rag_result = rag_generate_feedback(
            component="reading",
            performance_summary=performance_summary,
            k=3,
        )
        feedback = rag_result["feedback"]
        structured_feedback = rag_result["structured_feedback"]
        estimated_band = rag_result["estimated_band"]
        top_descriptor_id = rag_result["top_descriptor_id"]

        # 5. Save to DB
        if data.student_id:
            try:
                student_res = (
                    supabase.table("students")
                    .select("id")
                    .eq("user_id", data.student_id)
                    .single()
                    .execute()
                )
                if not student_res.data:
                    raise Exception("Student record not found")

                actual_student_id = student_res.data["id"]

                session_res = supabase.table("practice_sessions").insert({
                    "student_id": actual_student_id,
                    "component": "reading",
                    "start_time": data.start_time or now,
                    "end_time": now,
                    "completed": True,
                }).execute()
                session_id = session_res.data[0]["id"] if session_res.data else None

                answer_rows = [{
                    "session_id": session_id,
                    "question_id": r["question_id"],
                    "component": "reading",
                    "student_answer": r["student_answer"],
                    "correct_answer": r["correct_answer"],
                    "is_correct": r["is_correct"],
                    "submitted_at": now,
                } for r in results]
                answers_res = supabase.table("student_answers").insert(answer_rows).execute()

                first_answer_id = answers_res.data[0]["id"] if answers_res.data else None
                supabase.table("ai_feedback").insert({
                    "answer_id": first_answer_id,
                    "descriptor_id": top_descriptor_id,
                    "estimated_band": estimated_band,
                    "feedback_text": feedback,
                    "generated_at": now,
                }).execute()

                band_number = float(estimated_band.replace("Band ", "").replace("+", ".5"))
                supabase.table("student_bands").upsert({
                    "student_id": actual_student_id,
                    "reading_band": band_number,
                    "calculated_at": now,
                }, on_conflict="student_id").execute()

            except Exception as db_err:
                print(f"DB save error: {db_err}")

        return {
            "set_number": data.set_number,
            "score": correct_count,
            "total": total,
            "score_percent": round(correct_count / total * 100, 1),
            "results": results,
            "feedback": feedback,
            "structured_feedback": structured_feedback,
            "estimated_band": estimated_band,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
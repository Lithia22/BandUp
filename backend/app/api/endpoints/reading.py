from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.config import supabase
from app.services.rag import rag_generate_feedback

router = APIRouter()

PART_SKILLS = {
    1: "Multiple matching (short texts) — reading multiple texts for specific factual information",

    2: "Multiple choice — reading for main ideas and supporting details; inferencing; identifying details and examples to support an argument; predicting outcomes",

    3: "Multiple choice — reading for main ideas and supporting details; inferencing; identifying details and examples to support an argument; predicting outcomes",

    4: "Multiple choice (two linked texts) — understanding the main idea and supporting details, and gist; understanding text organisation features; deducing meaning from context; distinguishing facts and opinions; interpreting text for author's intention, attitudes and style; comparing and evaluating information in different texts",

    5: "Gapped text — identifying the purpose of a paragraph or text; recognising the text structure of the whole text; identifying cause and effect relationships in a text",

    6: "Multiple choice (complex text) — recognising text content features including detail, opinion, emotions, attitude, writer's purpose, main idea and implication; recognising text organisation features including exemplification, comparison and reference",

    7: "Multiple choice (complex text) — recognising text content features including detail, opinion, emotions, attitude, writer's purpose, main idea and implication; recognising text organisation features including exemplification, comparison and reference",
}


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
            .select("id, part_number, question_number, passage_title, passage, question_text, options, correct_answer, year")
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
        for q in questions:
            student_ans = data.answers.get(q["id"], None)
            is_correct = student_ans == q["correct_answer"]
            if is_correct:
                correct_count += 1
            results.append({
                "question_id": q["id"],
                "question_number": q["question_number"],
                "part_number": q["part_number"],
                "student_answer": student_ans,
                "correct_answer": q["correct_answer"],
                "is_correct": is_correct,
            })

        total = len(questions)
        skipped_count = sum(1 for r in results if not r["student_answer"])

        # 3. Build per-part summary with STRONG / WEAK / HEAVILY SKIPPED labels
        part_scores = {}
        for r in results:
            p = r["part_number"]
            if p not in part_scores:
                part_scores[p] = {"correct": 0, "total": 0, "skipped": 0}
            part_scores[p]["total"] += 1
            if r["is_correct"]:
                part_scores[p]["correct"] += 1
            if not r["student_answer"]:
                part_scores[p]["skipped"] += 1

        strong_parts, weak_parts, skipped_parts = [], [], []
        part_lines = []

        for p in sorted(part_scores.keys()):
            s = part_scores[p]
            pct = s["correct"] / s["total"] if s["total"] > 0 else 0
            if s["skipped"] >= s["total"] // 2:
                skipped_parts.append(p)
            elif pct >= 0.6:
                strong_parts.append(p)
            else:
                weak_parts.append(p)
            skill = PART_SKILLS.get(p, "Reading comprehension")
            part_lines.append(
                f"  Part {p} ({skill}): {s['correct']}/{s['total']} correct, {s['skipped']} skipped"
            )

        skipped_note = (
            "• You left questions unanswered — remember there is no penalty for wrong answers in MUET, so always attempt every question even if you are unsure."
            if skipped_parts else ""
        )

        performance_summary = f"""Student completed MUET Reading practice test (Set {data.set_number}).
Overall score: {correct_count}/{total} correct. Total skipped: {skipped_count}/{total}.

Per-part breakdown:
{chr(10).join(part_lines)}

STRONG parts (most questions correct): {", ".join(f"Part {p}" for p in strong_parts) or "None"}
WEAK parts (few or no correct answers): {", ".join(f"Part {p}" for p in weak_parts) or "None"}
HEAVILY SKIPPED parts (skipped most or all questions): {", ".join(f"Part {p}" for p in skipped_parts) or "None"}"""
        
        print(performance_summary)

        # 4. RAG: embed → KNN → LLM
        rag_result = rag_generate_feedback(
            component="reading",
            performance_summary=performance_summary,
            k=3,
            skipped_note=skipped_note,
        )
        feedback = rag_result["feedback"]
        structured_feedback = rag_result["structured_feedback"]
        estimated_band = rag_result["estimated_band"]
        
        if correct_count == 0:
            estimated_band = "Band 1"
        
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
            "total": total,
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
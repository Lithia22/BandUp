from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.config import supabase
from app.services.rag import rag_generate_feedback
import json

router = APIRouter()


@router.get("/sets")
def get_sets():
    try:
        result = (
            supabase.table("questions")
            .select("set_number, year")
            .eq("component", "writing")
            .execute()
        )
        seen = {}
        for row in result.data:
            key = (row["set_number"], row["year"])
            if key not in seen:
                seen[key] = True
        sets = [
            {
                "set_number": sn,
                "year": yr,
                "label": f"Practice Set {sn} ({yr})",
                "duration_mins": 25,
                "min_words": 100,
            }
            for sn, yr in sorted(seen.keys())
        ]
        return {"sets": sets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sets/{set_number}")
def get_set_question(set_number: int, year: Optional[int] = None):
    try:
        query = (
            supabase.table("questions")
            .select("id, part_number, question_number, question_text, passage, options, year")
            .eq("component", "writing")
            .eq("set_number", set_number)
        )
        if year:
            query = query.eq("year", year)
        else:
            query = query.order("year", desc=True).limit(1)

        result = query.execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Set not found")
        
        question = result.data[0]
        
        return {
            "set_number": set_number,
            "year": question.get("year"),
            "question": question
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SubmitRequest(BaseModel):
    set_number: int
    question_id: str
    student_answer: str
    student_id: Optional[str] = None
    start_time: Optional[str] = None


@router.post("/submit")
def submit_answer(data: SubmitRequest):
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # 1. Fetch question to get notes and passage
        result = (
            supabase.table("questions")
            .select("id, options, passage, question_text")
            .eq("id", data.question_id)
            .single()
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Question not found")

        question = result.data
        notes = question["options"]
        passage = question.get("passage", "")
        question_text = question.get("question_text", "")

        # 2. Get student name if student_id exists
        student_name = ""
        if data.student_id:
            try:
                user_res = (
                    supabase.table("users")
                    .select("full_name")
                    .eq("id", data.student_id)
                    .single()
                    .execute()
                )
                if user_res.data:
                    student_name = user_res.data["full_name"]
            except Exception as e:
                print(f"Error fetching student name: {e}")

        # 3. Parse passage to get email context
        email_preview = ""
        try:
            if passage:
                passage_data = json.loads(passage)
                email_context = passage_data.get("context", "")
                email_from = passage_data.get("from", "")
                email_subject = passage_data.get("subject", "")
                email_paragraphs = passage_data.get("paragraphs", [])
                
                email_preview = f"""
Original Email:
From: {email_from}
Subject: {email_subject}
{email_context}
"""
                for p in email_paragraphs:
                    email_preview += f"\n{p.get('text', '')}"
                    if p.get('note'):
                        email_preview += f"\nNote: {p['note']}"
        except:
            email_preview = f"Task: {question_text}"

        # 4. Count words in student answer
        word_count = len(data.student_answer.strip().split()) if data.student_answer.strip() else 0
        
        # 5. Build notes text
        notes_text = "\n".join([f"  - {v}" for v in notes.values()])
        
        # 6. Build performance summary for RAG
        performance_summary = f"""Student completed MUET Writing Task 1 (Set {data.set_number}).
Student name: {student_name if student_name else '[Your Name]'}

{email_preview}

Task: Write a reply of at least 100 words using all 4 notes given.
Word count: {word_count} words (minimum required: 100 words).

Notes the student was required to address:
{notes_text}

Student's response:
{data.student_answer}"""
        
        print(performance_summary)

        # 7. RAG: embed → KNN → LLM
        rag_result = rag_generate_feedback(
            component="writing",
            performance_summary=performance_summary,
            k=3,
        )
        feedback = rag_result["feedback"]
        structured_feedback = rag_result["structured_feedback"]
        estimated_band = rag_result["estimated_band"]
        top_descriptor_id = rag_result["top_descriptor_id"]
        suggested_answer = structured_feedback.get("suggested_answer", "")

        # 8. Save to DB
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
                    "component": "writing",
                    "start_time": data.start_time or now,
                    "end_time": now,
                    "completed": True,
                }).execute()
                session_id = session_res.data[0]["id"] if session_res.data else None

                answers_res = supabase.table("student_answers").insert({
                    "session_id": session_id,
                    "question_id": data.question_id,
                    "component": "writing",
                    "student_answer": data.student_answer,
                    "correct_answer": None,
                    "is_correct": None,
                    "submitted_at": now,
                }).execute()

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
                    "writing_band": band_number,
                    "calculated_at": now,
                }, on_conflict="student_id").execute()

            except Exception as db_err:
                print(f"DB save error: {db_err}")

        return {
            "set_number": data.set_number,
            "word_count": word_count,
            "student_answer": data.student_answer,
            "feedback": feedback,
            "structured_feedback": structured_feedback,
            "estimated_band": estimated_band,
            "suggested_answer": suggested_answer,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
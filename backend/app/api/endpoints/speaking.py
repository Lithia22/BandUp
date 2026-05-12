from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone
from app.config import supabase
from app.services.rag import rag_generate_feedback
from app.services.whisper import transcribe_audio, detect_filler_words

router = APIRouter()


@router.get("/sets")
def get_sets():
    try:
        result = (
            supabase.table("questions")
            .select("set_number, year, part_number")
            .eq("component", "speaking")
            .order("set_number")
            .execute()
        )

        seen = {}
        for row in result.data:
            key = (row["set_number"], row["year"])
            if key not in seen:
                seen[key] = {"parts": set()}
            seen[key]["parts"].add(row["part_number"])

        sets = [
            {
                "set_number": sn,
                "year": yr,
                "label": f"Practice Set {sn} ({yr})",
                "total_booklets": len(info["parts"]),
                "duration_prep_secs": 120,
                "duration_speak_secs": 120,
            }
            for (sn, yr), info in sorted(seen.items())
        ]
        return {"sets": sets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sets/{set_number}")
def get_booklets(set_number: int, year: Optional[int] = None):
    try:
        query = (
            supabase.table("questions")
            .select("part_number, passage_title, passage, year")
            .eq("component", "speaking")
            .eq("set_number", set_number)
            .order("part_number")
        )
        if year:
            query = query.eq("year", year)

        result = query.execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Set not found")

        seen = {}
        for row in result.data:
            pn = row["part_number"]
            if pn not in seen:
                seen[pn] = row

        booklets = [seen[pn] for pn in sorted(seen.keys())]
        return {"set_number": set_number, "booklets": booklets}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sets/{set_number}/{booklet_number}")
def get_candidates(set_number: int, booklet_number: int, year: Optional[int] = None):
    try:
        query = (
            supabase.table("questions")
            .select("id, question_number, passage_title, passage, question_text, year")
            .eq("component", "speaking")
            .eq("set_number", set_number)
            .eq("part_number", booklet_number)
            .order("question_number")
        )
        if year:
            query = query.eq("year", year)

        result = query.execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Booklet not found")

        return {
            "set_number": set_number,
            "booklet_number": booklet_number,
            "candidates": result.data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
async def submit_speaking(
    audio: UploadFile = File(...),
    set_number: int = Form(...),
    part_number: int = Form(...),
    question_id: str = Form(...),
    candidate: str = Form(...),
    student_id: Optional[str] = Form(None),
    start_time: Optional[str] = Form(None),
):
    try:
        now = datetime.now(timezone.utc).isoformat()

        # 1. Read audio bytes
        audio_bytes = await audio.read()
        filename = audio.filename or "speech.wav"

        # 2. Transcribe via Groq Whisper
        try:
            transcript = await transcribe_audio(audio_bytes, filename)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Transcription failed: {str(e)}")

        if not transcript or len(transcript.strip()) < 5:
            raise HTTPException(
                status_code=422,
                detail="Could not transcribe audio. Please speak clearly and try again."
            )

        # 3. Detect filler words
        filler_result = detect_filler_words(transcript)

        # 4. Fetch question details
        q_result = (
            supabase.table("questions")
            .select("passage, question_text, passage_title")
            .eq("id", question_id)
            .single()
            .execute()
        )
        if not q_result.data:
            raise HTTPException(status_code=404, detail="Question not found")

        q = q_result.data
        word_count = len(transcript.strip().split())

        # 5. Build filler summary for performance_summary
        filler_summary = ""
        if filler_result["has_fillers"]:
            breakdown = ", ".join([f'"{w}" (×{c})' for w, c in filler_result["breakdown"].items()])
            filler_summary = f"\nFiller words detected in transcript: {breakdown}. Total filler word count: {filler_result['total']}."

        # 6. Build performance summary for RAG
        performance_summary = f"""Student completed MUET Speaking Part 1 Individual Presentation (Set {set_number}, Booklet {part_number}, Candidate {candidate}).

Topic situation: {q['passage']}
Student's specific prompt: {q['question_text']}

Transcript of student's spoken response (transcribed via speech-to-text):
{transcript}

Word count: {word_count} words (expected: approximately 200-250 words for a 2-minute presentation).
{filler_summary}"""
        
        print(performance_summary)

        # 7. RAG: embed → KNN → LLM
        rag_result = rag_generate_feedback(
            component="speaking",
            performance_summary=performance_summary,
            k=3,
        )
        feedback = rag_result["feedback"]
        structured_feedback = rag_result["structured_feedback"]
        estimated_band = rag_result["estimated_band"]
        top_descriptor_id = rag_result["top_descriptor_id"]
        speaking_script = structured_feedback.get("speaking_script", "")

        # 8. Save to DB
        if student_id:
            try:
                student_res = (
                    supabase.table("students")
                    .select("id")
                    .eq("user_id", student_id)
                    .single()
                    .execute()
                )
                if not student_res.data:
                    raise Exception("Student record not found")

                actual_student_id = student_res.data["id"]

                session_res = supabase.table("practice_sessions").insert({
                    "student_id": actual_student_id,
                    "component": "speaking",
                    "start_time": start_time or now,
                    "end_time": now,
                    "completed": True,
                }).execute()
                session_id = session_res.data[0]["id"] if session_res.data else None

                answers_res = supabase.table("student_answers").insert({
                    "session_id": session_id,
                    "question_id": question_id,
                    "component": "speaking",
                    "student_answer": transcript,
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
                    "speaking_band": band_number,
                    "calculated_at": now,
                }, on_conflict="student_id").execute()

            except Exception as db_err:
                print(f"DB save error: {db_err}")

        return {
            "set_number": set_number,
            "part_number": part_number,
            "candidate": candidate,
            "transcript": transcript,
            "word_count": word_count,
            "filler_words": filler_result,
            "feedback": feedback,
            "structured_feedback": structured_feedback,
            "estimated_band": estimated_band,
            "speaking_script": speaking_script,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
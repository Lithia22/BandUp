from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from app.config import supabase

router = APIRouter()

def band_to_num(band_str):
    if not band_str:
        return None
    if band_str == "Band 1":
        return 1
    mapping = {"Band 2": 2, "Band 3": 3, "Band 4": 4, "Band 5": 5, "Band 5+": 6}
    return mapping.get(band_str)


@router.get("")
def get_dashboard(user_id: str):
    try:
        student_res = (
            supabase.table("students")
            .select("id")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not student_res.data:
            raise HTTPException(status_code=404, detail="Student not found")

        student_id = student_res.data["id"]

        # Get latest bands from student_bands
        try:
            bands_res = (
                supabase.table("student_bands")
                .select("reading_band, listening_band, writing_band, speaking_band")
                .eq("student_id", student_id)
                .order("calculated_at", desc=True)
                .limit(1)
                .execute()
            )
            if bands_res.data:
                bands = bands_res.data[0]
            else:
                bands = {}
        except Exception:
            bands = {}

        # Get all sessions
        all_sessions_res = (
            supabase.table("practice_sessions")
            .select("id, component, end_time")
            .eq("student_id", student_id)
            .eq("completed", True)
            .order("end_time", desc=False)
            .execute()
        )
        all_sessions = all_sessions_res.data or []
        components = ["reading", "listening", "writing", "speaking"]

        # Attempts count
        attempts = {"reading": 0, "listening": 0, "writing": 0, "speaking": 0}
        for s in all_sessions:
            comp = s.get("component")
            if comp in attempts:
                attempts[comp] += 1

        # Get latest 20 sessions per component
        top_per_comp = {}
        for comp in components:
            comp_sessions = [s for s in all_sessions if s.get("component") == comp]
            top_per_comp[comp] = comp_sessions[-20:] if comp_sessions else []

        # Get answers and feedback
        target_sessions = [s for sessions in top_per_comp.values() for s in sessions]
        target_ids = [s["id"] for s in target_sessions]

        # Get answers
        session_to_answers = {}
        for i in range(0, len(target_ids), 20):
            chunk = target_ids[i:i+20]
            ans_res = (
                supabase.table("student_answers")
                .select("id, session_id, question_id")
                .in_("session_id", chunk)
                .execute()
            )
            for a in (ans_res.data or []):
                sid = a["session_id"]
                if sid not in session_to_answers:
                    session_to_answers[sid] = []
                session_to_answers[sid].append(a)

        # Get all question IDs and build question_map with set_number and year
        all_question_ids = []
        for answers in session_to_answers.values():
            for a in answers:
                if a.get("question_id"):
                    all_question_ids.append(a["question_id"])
        
        # Remove duplicates
        all_question_ids = list(set(all_question_ids))
        
        question_map = {}
        if all_question_ids:
            for i in range(0, len(all_question_ids), 20):
                chunk = all_question_ids[i:i+20]
                q_res = (
                    supabase.table("questions")
                    .select("id, set_number, year")
                    .in_("id", chunk)
                    .execute()
                )
                for q in (q_res.data or []):
                    question_map[q["id"]] = {"set_number": q["set_number"], "year": q["year"]}

        # Get feedback
        all_answer_ids = [a["id"] for answers in session_to_answers.values() for a in answers]
        feedback_map = {}
        for i in range(0, len(all_answer_ids), 20):
            chunk = all_answer_ids[i:i+20]
            fb_res = (
                supabase.table("ai_feedback")
                .select("answer_id, estimated_band")
                .in_("answer_id", chunk)
                .execute()
            )
            for fb in (fb_res.data or []):
                feedback_map[fb["answer_id"]] = fb["estimated_band"]

        # Build history (ONE entry per session)
        history = []
        for comp in components:
            for s in reversed(top_per_comp[comp]):
                answers = session_to_answers.get(s["id"], [])
                
                # Get band from first answer that has feedback
                session_band = None
                for ans in answers:
                    band = feedback_map.get(ans["id"])
                    if band:
                        session_band = band
                        break
                
                # Get set number and year from first answer that has a question
                set_number = None
                set_year = None
                for ans in answers:
                    q_id = ans.get("question_id")
                    if q_id and q_id in question_map:
                        set_number = question_map[q_id]["set_number"]
                        set_year = question_map[q_id]["year"]
                        break
                
                # Build label with year
                if set_number and set_year:
                    set_label = f"Practice Set {set_number} ({set_year})"
                elif set_number:
                    set_label = f"Practice Set {set_number}"
                else:
                    set_label = "—"
                
                history.append({
                    "component": comp,
                    "set_label": set_label,
                    "band": session_band,
                    "end_time": s.get("end_time", ""),
                })

        # Band trend
        band_trend = {}
        for comp in components:
            trend = []
            session_index = 1
            for s in top_per_comp[comp]:
                answers = session_to_answers.get(s["id"], [])
                band_num = None
                for ans in answers:
                    band_str = feedback_map.get(ans["id"])
                    if band_str:
                        band_num = band_to_num(band_str)
                        break
                if band_num is not None:
                    trend.append({
                        "session": session_index,
                        "band": band_num,
                        "date": s["end_time"][:10],
                    })
                session_index += 1
            band_trend[comp] = trend

        # Latest band per component (from student_bands table)
        component_bands = {}
        for comp in components:
            band_key = f"{comp}_band"
            component_bands[comp] = bands.get(band_key)

        # Calendar
        sessions_by_day = {}
        for s in all_sessions:
            if s.get("end_time"):
                date_key = s["end_time"][:10]
                sessions_by_day[date_key] = sessions_by_day.get(date_key, 0) + 1

        # Weekly data
        MYT = timezone(timedelta(hours=8))
        now = datetime.now(MYT)
        days_map = {}
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            days_map[day.strftime('%Y-%m-%d')] = {"day": day.strftime('%a'), "sessions": 0}
        for s in all_sessions:
            if s.get("end_time"):
                utc_dt = datetime.fromisoformat(s["end_time"].replace('Z', '+00:00'))
                myt_dt = utc_dt.astimezone(MYT)
                date_key = myt_dt.strftime('%Y-%m-%d')
                if date_key in days_map:
                    days_map[date_key]["sessions"] += 1

        return {
            "bands": bands,
            "attempts": attempts,
            "history": history,
            "sessions_by_day": sessions_by_day,
            "weekly": list(days_map.values()),
            "band_trend": band_trend,
            "component_bands": component_bands,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
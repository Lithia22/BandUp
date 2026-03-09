from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from app.config import supabase

router = APIRouter()

def band_to_num(band_str):
    if not band_str:
        return None
    mapping = {"Band 1": 1, "Band 2": 2, "Band 3": 3, "Band 4": 4, "Band 5": 5, "Band 5+": 6}
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

        try:
            bands_res = (
                supabase.table("student_bands")
                .select("reading_band, listening_band, writing_band, speaking_band")
                .eq("student_id", student_id)
                .single()
                .execute()
            )
            bands = bands_res.data or {}
        except Exception:
            bands = {}

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

        # Pick sessions we actually need: top 10 per component for history/trend
        top_per_comp = {}
        for comp in components:
            top_per_comp[comp] = [s for s in all_sessions if s.get("component") == comp][-10:]

        target_sessions = [s for sessions in top_per_comp.values() for s in sessions]
        target_ids = [s["id"] for s in target_sessions]

        # Bulk fetch answers + feedback in chunks of 20
        chunk_size = 20
        session_to_answer = {}
        for i in range(0, len(target_ids), chunk_size):
            chunk = target_ids[i:i + chunk_size]
            ans_res = (
                supabase.table("student_answers")
                .select("id, session_id, question_id")
                .in_("session_id", chunk)
                .execute()
            )
            for a in (ans_res.data or []):
                sid = a["session_id"]
                if sid not in session_to_answer:
                    session_to_answer[sid] = a

        answer_ids = [a["id"] for a in session_to_answer.values()]
        question_ids = [a["question_id"] for a in session_to_answer.values() if a.get("question_id")]

        feedback_map = {}
        for i in range(0, len(answer_ids), chunk_size):
            chunk = answer_ids[i:i + chunk_size]
            fb_res = (
                supabase.table("ai_feedback")
                .select("answer_id, estimated_band")
                .in_("answer_id", chunk)
                .execute()
            )
            for fb in (fb_res.data or []):
                feedback_map[fb["answer_id"]] = fb["estimated_band"]

        question_map = {}
        if question_ids:
            for i in range(0, len(question_ids), chunk_size):
                chunk = question_ids[i:i + chunk_size]
                q_res = (
                    supabase.table("questions")
                    .select("id, set_number")
                    .in_("id", chunk)
                    .execute()
                )
                for q in (q_res.data or []):
                    question_map[q["id"]] = q["set_number"]

        # History (for dashboard recent history tab)
        history = []
        for comp in components:
            for s in reversed(top_per_comp[comp]):
                ans = session_to_answer.get(s["id"])
                band_str = None
                set_number = None
                if ans:
                    band_str = feedback_map.get(ans["id"])
                    set_number = question_map.get(ans.get("question_id"))
                history.append({
                    "component": comp,
                    "set_label": f"Practice Set {set_number}" if set_number else "—",
                    "band": band_str,
                    "end_time": s.get("end_time", ""),
                })

        # Band trend (for analytics — last 10 per component oldest→newest)
        band_trend = {}
        for comp in components:
            trend = []
            for i, s in enumerate(top_per_comp[comp]):
                ans = session_to_answer.get(s["id"])
                band_num = band_to_num(feedback_map.get(ans["id"]) if ans else None)
                if band_num is not None:
                    trend.append({
                        "session": i + 1,
                        "band": band_num,
                        "date": s["end_time"][:10],
                    })
            band_trend[comp] = trend

        # Latest band per component (for analytics radar)
        component_bands = {}
        for comp in components:
            latest = None
            for s in reversed(top_per_comp[comp]):
                ans = session_to_answer.get(s["id"])
                if ans:
                    num = band_to_num(feedback_map.get(ans["id"]))
                    if num is not None:
                        latest = num
                        break
            component_bands[comp] = latest

        # Calendar sessions_by_day
        sessions_by_day = {}
        for s in all_sessions:
            if s.get("end_time"):
                date_key = s["end_time"][:10]
                sessions_by_day[date_key] = sessions_by_day.get(date_key, 0) + 1

        # Rolling 7 days (MYT UTC+8)
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
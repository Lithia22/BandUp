from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.config import supabase
from app.services.clustering import run_kmeans

router = APIRouter()


@router.get("/clusters")
def get_clusters():
    try:
        # Fetch all student band records
        bands_res = (
            supabase.table("student_bands")
            .select("id, student_id, listening_band, reading_band, writing_band, speaking_band")
            .execute()
        )
        bands = bands_res.data or []

        if not bands:
            return {"clusters": [], "summary": {}, "total_students": 0}

        # Fetch student → user join to get full_name and email
        student_ids = [b["student_id"] for b in bands]
        chunk_size = 20
        student_info = {}
        for i in range(0, len(student_ids), chunk_size):
            chunk = student_ids[i:i + chunk_size]
            students_res = (
                supabase.table("students")
                .select("id, user_id")
                .in_("id", chunk)
                .execute()
            )
            user_ids = [s["user_id"] for s in (students_res.data or [])]
            student_id_to_user = {s["id"]: s["user_id"] for s in (students_res.data or [])}

            if user_ids:
                users_res = (
                    supabase.table("users")
                    .select("id, full_name, email")
                    .in_("id", user_ids)
                    .execute()
                )
                user_map = {u["id"]: u for u in (users_res.data or [])}
                for sid, uid in student_id_to_user.items():
                    student_info[sid] = user_map.get(uid, {})

        # Prepare data for clustering
        students = [
            {
                "student_band_id": b["id"],
                "student_id": b["student_id"],
                "full_name": student_info.get(b["student_id"], {}).get("full_name", "Unknown"),
                "email": student_info.get(b["student_id"], {}).get("email", ""),
                "listening_band": b["listening_band"] or 0,
                "reading_band": b["reading_band"] or 0,
                "writing_band": b["writing_band"] or 0,
                "speaking_band": b["speaking_band"] or 0,
            }
            for b in bands
        ]

        # Run K-means (no fallback — requires real data)
        results = run_kmeans(students, k=4)
        label_map = {r["student_band_id"]: r["cluster_label"] for r in results}

        # Upsert cluster assignments
        now = datetime.now(timezone.utc).isoformat()
        for r in results:
            existing = (
                supabase.table("cluster_assignments")
                .select("id")
                .eq("student_band_id", r["student_band_id"])
                .execute()
            )
            if existing.data:
                supabase.table("cluster_assignments").update(
                    {"cluster_label": r["cluster_label"], "assigned_at": now}
                ).eq("student_band_id", r["student_band_id"]).execute()
            else:
                supabase.table("cluster_assignments").insert(
                    {"student_band_id": r["student_band_id"], "cluster_label": r["cluster_label"], "assigned_at": now}
                ).execute()

        # Build response
        cluster_details = []
        for s in students:
            label = label_map.get(s["student_band_id"], "Balanced Performer")
            cluster_details.append({
                "student_id": s["student_id"],
                "student_band_id": s["student_band_id"],
                "full_name": s["full_name"],
                "email": s["email"],
                "listening_band": s["listening_band"],
                "reading_band": s["reading_band"],
                "writing_band": s["writing_band"],
                "speaking_band": s["speaking_band"],
                "cluster_label": label,
            })

        summary = {}
        for d in cluster_details:
            summary[d["cluster_label"]] = summary.get(d["cluster_label"], 0) + 1

        cluster_averages = {}
        for label in summary:
            members = [d for d in cluster_details if d["cluster_label"] == label]
            cluster_averages[label] = {
                "count": len(members),
                "avg_listening": round(sum(m["listening_band"] for m in members) / len(members), 2),
                "avg_reading":   round(sum(m["reading_band"]   for m in members) / len(members), 2),
                "avg_writing":   round(sum(m["writing_band"]   for m in members) / len(members), 2),
                "avg_speaking":  round(sum(m["speaking_band"]  for m in members) / len(members), 2),
            }

        return {
            "total_students": len(students),
            "summary": summary,
            "cluster_averages": cluster_averages,
            "students": cluster_details,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
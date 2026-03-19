from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from datetime import datetime, timezone
from app.config import supabase
from app.services.clustering import run_kmeans
from pydantic import BaseModel
from typing import Optional, Any
import uuid
import httpx
import os

router = APIRouter()


class QuestionCreate(BaseModel):
    component: str
    set_number: int
    part_number: int
    question_number: int
    question_text: Optional[str] = None
    options: Optional[Any] = None
    correct_answer: Optional[str] = None
    passage: Optional[str] = None
    passage_title: Optional[str] = None
    audio_url: Optional[str] = None
    year: Optional[int] = None
    passage_text: Optional[str] = None
    passage_type: Optional[str] = None
    col_a: Optional[str] = None
    col_b: Optional[str] = None
    col_c: Optional[str] = None
    text1: Optional[str] = None
    text2: Optional[str] = None
    sentences: Optional[Any] = None


class QuestionUpdate(BaseModel):
    component: Optional[str] = None
    set_number: Optional[int] = None
    part_number: Optional[int] = None
    question_number: Optional[int] = None
    question_text: Optional[str] = None
    options: Optional[Any] = None
    correct_answer: Optional[str] = None
    passage: Optional[str] = None
    passage_title: Optional[str] = None
    audio_url: Optional[str] = None
    year: Optional[int] = None
    passage_text: Optional[str] = None
    passage_type: Optional[str] = None
    col_a: Optional[str] = None
    col_b: Optional[str] = None
    col_c: Optional[str] = None
    text1: Optional[str] = None
    text2: Optional[str] = None
    sentences: Optional[Any] = None


@router.get("/questions")
def get_questions(component: Optional[str] = None, set_number: Optional[int] = None):
    try:
        query = supabase.table("questions").select("*")
        if component:
            query = query.eq("component", component)
        if set_number:
            query = query.eq("set_number", set_number)
        result = query.order("part_number").order("question_number").execute()
        return {"questions": result.data, "total": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/questions")
def create_question(data: QuestionCreate):
    try:
        payload = data.model_dump(exclude_none=True)
        payload["id"] = str(uuid.uuid4())
        result = supabase.table("questions").insert(payload).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Insert failed")
        return {"message": "Question created", "question": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/questions/{question_id}")
def update_question(question_id: str, data: QuestionUpdate):
    try:
        payload = data.model_dump(exclude_none=True)
        if not payload:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = (
            supabase.table("questions")
            .update(payload)
            .eq("id", question_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question updated", "question": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/questions/{question_id}")
def delete_question(question_id: str):
    try:
        result = (
            supabase.table("questions")
            .delete()
            .eq("id", question_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question deleted", "id": question_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/questions")
def delete_questions(component: Optional[str] = None, set_number: Optional[int] = None):
    try:
        if not component or not set_number:
            raise HTTPException(status_code=400, detail="Component and set_number are required")
        result = (
            supabase.table("questions")
            .select("id")
            .eq("component", component)
            .eq("set_number", set_number)
            .execute()
        )
        if not result.data:
            return {"message": f"No questions found for {component} set {set_number}", "deleted_count": 0}
        supabase.table("questions").delete().eq("component", component).eq("set_number", set_number).execute()
        return {"message": f"Deleted {len(result.data)} questions from {component} set {set_number}", "deleted_count": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    bucket: str = Form(...),
    path: str = Form(...),
):
    try:
        supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        service_key = os.environ.get("SUPABASE_SERVICE_KEY")

        if not supabase_url or not service_key:
            raise HTTPException(status_code=500, detail="Supabase credentials not configured")

        file_bytes = await file.read()
        content_type = file.content_type or "application/octet-stream"
        upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{path}"

        print(f"[upload] uploading to {upload_url}, size={len(file_bytes)}, type={content_type}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                upload_url,
                content=file_bytes,
                headers={
                    "Authorization": f"Bearer {service_key}",
                    "Content-Type": content_type,
                    "x-upsert": "true",
                },
            )
            print(f"[upload] response status={res.status_code}, body={res.text[:200]}")
            if res.status_code not in (200, 201):
                raise HTTPException(status_code=500, detail=f"Supabase upload failed ({res.status_code}): {res.text}")

        public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{path}"
        return {"url": public_url, "path": path, "bucket": bucket}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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
        # Fetch student
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

        # Run K-means
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
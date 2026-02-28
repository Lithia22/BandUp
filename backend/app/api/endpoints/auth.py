from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import supabase

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "student"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(data: RegisterRequest):
    try:
        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "full_name": data.full_name,
                    "role": data.role
                }
            }
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Registration failed")

        user_id = response.user.id

        if data.role == "student":
            supabase.table("students").insert({
                "user_id": user_id
            }).execute()

        elif data.role == "admin":
            supabase.table("admins").insert({
                "user_id": user_id
            }).execute()

        return {
            "message": "Registration successful",
            "user_id": user_id,
            "role": data.role
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(data: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })

        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Get user profile from our users table
        user = supabase.table("users").select("*").eq(
            "id", response.user.id
        ).single().execute()

        return {
            "message": "Login successful",
            "access_token": response.session.access_token,
            "user": user.data
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
def get_me(user_id: str):
    try:
        user = supabase.table("users").select("*").eq(
            "id", user_id
        ).single().execute()

        return user.data

    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
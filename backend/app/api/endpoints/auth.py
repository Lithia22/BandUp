from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.config import supabase, JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import uuid
import re

router = APIRouter()

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

# Password Validation 
def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not re.search(r"[!@#$%^&*]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character (!@#$%^&*)")
    return True

# Auth Routes
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

@router.post("/register")
def register(data: RegisterRequest):
    try:
        # Validate password strength
        validate_password(data.password)
        
        # Check if email already exists
        existing = supabase.table("users").select("id").eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash the password
        hashed_password = hash_password(data.password)
        
        # Generate new UUID for user
        user_id = str(uuid.uuid4())

        # Insert into users table with hashed password
        user_result = supabase.table("users").insert({
            "id": user_id,
            "email": data.email,
            "full_name": data.full_name,
            "password": hashed_password,
            "role": "student"
        }).execute()

        # Insert into students table
        supabase.table("students").insert({
            "user_id": user_id
        }).execute()

        # Create JWT token
        token = create_access_token({
            "sub": user_id,
            "email": data.email,
            "role": "student"
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": data.email,
                "full_name": data.full_name,
                "role": "student"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(data: LoginRequest):
    try:
        # Find user by email
        user_result = supabase.table("users").select("*").eq("email", data.email).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = user_result.data[0]

        # Verify password against hash
        if not verify_password(data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Fix admin role if needed
        if user["email"] == "admin@gmail.com":
            admin_check = supabase.table("admins").select("id").eq("user_id", user["id"]).execute()
            if admin_check.data and user["role"] != "admin":
                supabase.table("users").update({"role": "admin"}).eq("id", user["id"]).execute()
                user["role"] = "admin"

        # Create JWT token
        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"]
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@router.put("/profile")
def update_profile(data: UpdateProfileRequest, user_id: str):
    try:
        # Build update dict with only provided fields
        update_data = {}
        if data.full_name:
            update_data["full_name"] = data.full_name
        if data.email:
            # Check if new email already exists (excluding current user)
            existing = supabase.table("users").select("id").eq("email", data.email).execute()
            if existing.data and existing.data[0]["id"] != user_id:
                raise HTTPException(status_code=400, detail="Email already in use")
            update_data["email"] = data.email

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Update users table
        result = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": result.data[0]["id"],
                "email": result.data[0]["email"],
                "full_name": result.data[0]["full_name"],
                "role": result.data[0]["role"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/verify")
def verify_token_endpoint(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="No token")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check if user still exists
    user = supabase.table("users").select("id").eq("id", payload.get("sub")).execute()
    if not user.data:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {"valid": True, "user_id": payload.get("sub")}

@router.get("/me")
def get_me(user_id: str):
    try:
        user = supabase.table("users").select("id, email, full_name, role").eq(
            "id", user_id
        ).single().execute()

        return user.data

    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
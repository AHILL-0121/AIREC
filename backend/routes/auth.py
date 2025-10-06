from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from utils.db import get_database
from utils.auth import get_password_hash, verify_password, create_access_token, decode_access_token
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # "candidate" or "recruiter"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    full_name: Optional[str] = None
    skills: Optional[list] = None
    experience: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Dependency to get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db = get_database()
    user = await db.users.find_one({"id": payload.get("sub")})
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@router.post("/signup")
async def signup(data: SignupRequest):
    db = get_database()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(data.password)
    
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hashed_password,
        "full_name": data.full_name,
        "role": data.role,
        "skills": [],
        "experience": 0,
        "created_at": datetime.utcnow(),
        "profile_complete": False
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id, "role": data.role})
    
    return {
        "success": True,
        "data": {
            "user": {
                "id": user_id,
                "email": data.email,
                "full_name": data.full_name,
                "role": data.role
            },
            "access_token": access_token,
            "token_type": "bearer"
        }
    }

@router.post("/login")
async def login(data: LoginRequest):
    db = get_database()
    
    # Find user
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    
    # Remove password from response
    user_data = {k: v for k, v in user.items() if k != "password" and k != "_id"}
    
    return {
        "success": True,
        "data": {
            "user": user_data,
            "access_token": access_token,
            "token_type": "bearer"
        }
    }

@router.get("/me")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_data = {k: v for k, v in current_user.items() if k != "password" and k != "_id"}
    return {
        "success": True,
        "data": user_data
    }

@router.put("/me")
async def update_profile(
    profile: UserProfile,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Prepare update data
    update_data = {k: v for k, v in profile.dict().items() if v is not None}
    update_data["profile_complete"] = True
    
    # Update user
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user["id"]})
    user_data = {k: v for k, v in updated_user.items() if k != "password" and k != "_id"}
    
    return {
        "success": True,
        "data": user_data
    }

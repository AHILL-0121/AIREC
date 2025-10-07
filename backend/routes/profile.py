from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from utils.db import get_database
from routes.auth import get_current_user

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    skills: Optional[list] = None
    experience: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None


@router.get("/{user_id}")
async def get_profile(user_id: str):
    db = get_database()
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove sensitive fields
    user_safe = {k: v for k, v in user.items() if k not in ("password", "_id")}
    return {"success": True, "data": user_safe}


@router.get("/candidate/{candidate_id}")
async def get_candidate_profile_for_recruiter(
    candidate_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Allow recruiters to view detailed candidate profiles"""
    # Only recruiters can access this endpoint
    if current_user.get("role") != "recruiter":
        raise HTTPException(status_code=403, detail="Access denied. Only recruiters can view candidate profiles.")
    
    db = get_database()
    candidate = await db.users.find_one({"id": candidate_id, "role": "candidate"})
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Return comprehensive candidate profile including resume data
    candidate_profile = {
        "id": candidate.get("id"),
        "full_name": candidate.get("full_name", ""),
        "email": candidate.get("email", ""),
        "phone": candidate.get("phone", ""),
        "location": candidate.get("location", ""),
        "bio": candidate.get("bio", ""),
        "skills": candidate.get("skills", []),
        "experience": candidate.get("experience", 0),
        "education": candidate.get("education", []),
        "achievements": candidate.get("achievements", []),
        "job_titles": candidate.get("job_titles", []),
        "certifications": candidate.get("certifications", []),
        "languages": candidate.get("languages", []),
        "projects": candidate.get("projects", []),
        "resume_filename": candidate.get("resume_filename", ""),
        "resume_uploaded_at": candidate.get("resume_uploaded_at", ""),
        "profile_complete": candidate.get("profile_complete", False),
        "created_at": candidate.get("created_at", ""),
        "updated_at": candidate.get("updated_at", "")
    }
    
    return {"success": True, "data": candidate_profile}

@router.put("/{user_id}")
async def update_profile(user_id: str, updates: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    # Only allow users to update their own profile (or recruiters to update others)
    if current_user["id"] != user_id and current_user.get("role") != "recruiter":
        raise HTTPException(status_code=403, detail="Permission denied")

    db = get_database()
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_data:
        return {"success": True, "data": {"message": "No changes"}}

    await db.users.update_one({"id": user_id}, {"$set": update_data})
    user = await db.users.find_one({"id": user_id})
    user_safe = {k: v for k, v in user.items() if k not in ("password", "_id")}
    return {"success": True, "data": user_safe}

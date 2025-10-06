from fastapi import APIRouter, HTTPException, Query, Depends
from routes.auth import get_current_user
from utils.db import get_database
from services.job_recommendation import get_recommendations_for_user
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import uuid

router = APIRouter()

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    required_skills: list
    location: Optional[str] = "Remote"
    min_experience: Optional[int] = 0
    max_experience: Optional[int] = 10
    salary_range: Optional[str] = None

@router.get("/search")
async def search_jobs(
    query: Optional[str] = None,
    skills: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 20
):
    db = get_database()
    
    # Build search filter
    search_filter = {"status": "active"}
    
    if query:
        search_filter["$or"] = [
            {"title": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}}
        ]
    
    if skills:
        skill_list = [s.strip() for s in skills.split(",")]
        search_filter["required_skills"] = {"$in": skill_list}
    
    if location:
        search_filter["location"] = {"$regex": location, "$options": "i"}
    
    # Execute search
    cursor = db.jobs.find(search_filter).limit(limit)
    jobs = await cursor.to_list(length=limit)
    
    # Convert _id to id
    for job in jobs:
        job["id"] = str(job["_id"])
        del job["_id"]
        job["posted_by"] = str(job["posted_by"])
    
    return {
        "success": True,
        "data": jobs
    }

@router.get("/recommendations")
async def get_recommended_jobs(current_user: dict = Depends(get_current_user)):
    # Get AI recommendations
    recommendations = await get_recommendations_for_user(current_user)
    
    return {
        "success": True,
        "data": recommendations
    }

@router.post("")
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Validate recruiter
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")
    
    # Create job document
    job_id = str(uuid.uuid4())
    job_doc = {
        "id": job_id,
        "title": job_data.title,
        "company": job_data.company,
        "description": job_data.description,
        "required_skills": job_data.required_skills,
        "location": job_data.location,
        "min_experience": job_data.min_experience,
        "max_experience": job_data.max_experience,
        "salary_range": job_data.salary_range,
        "posted_by": current_user["id"],
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    await db.jobs.insert_one(job_doc)
    
    # Remove MongoDB _id and ensure proper serialization
    if "_id" in job_doc:
        del job_doc["_id"]
    job_doc["posted_by"] = str(job_doc["posted_by"])
    
    return {
        "success": True,
        "data": job_doc
    }

@router.get("/{job_id}")
async def get_job(job_id: str):
    db = get_database()
    
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job["id"] = str(job["_id"]) if "_id" in job else job["id"]
    if "_id" in job:
        del job["_id"]
    job["posted_by"] = str(job["posted_by"])
    
    return {
        "success": True,
        "data": job
    }

@router.get("/recruiter/my-jobs")
async def get_recruiter_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can access this")
    
    db = get_database()
    jobs = await db.jobs.find({"posted_by": current_user["id"]}).to_list(length=100)
    
    for job in jobs:
        job["id"] = str(job["_id"]) if "_id" in job else job["id"]
        if "_id" in job:
            del job["_id"]
        job["posted_by"] = str(job["posted_by"])
    
    return {
        "success": True,
        "data": jobs
    }

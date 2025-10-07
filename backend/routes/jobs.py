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
    required_skills: list = []
    preferred_skills: list = []
    location: Optional[str] = "Remote"
    min_experience: Optional[int] = 0
    max_experience: Optional[int] = 10
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: Optional[str] = "full-time"

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
        "preferred_skills": job_data.preferred_skills,
        "location": job_data.location,
        "min_experience": job_data.min_experience,
        "max_experience": job_data.max_experience,
        "salary_min": job_data.salary_min,
        "salary_max": job_data.salary_max,
        "job_type": job_data.job_type,
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
    
    # First try to find by id field
    job = await db.jobs.find_one({"id": job_id})
    
    # If not found, try to find by MongoDB's _id (if valid ObjectId)
    if not job:
        try:
            from bson.objectid import ObjectId
            if ObjectId.is_valid(job_id):
                job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        except ImportError:
            pass
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Ensure consistent id field and format
    job["id"] = str(job.get("_id", job.get("id", "")))
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
@router.put("/{job_id}")
async def update_job(
    job_id: str,
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing job posting"""
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can update jobs")
    
    db = get_database()
    
    # Find the job
    job = await db.jobs.find_one({"id": job_id})
    
    # If not found by id, try _id (if valid ObjectId)
    if not job:
        try:
            from bson.objectid import ObjectId
            if ObjectId.is_valid(job_id):
                job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        except ImportError:
            pass
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify ownership
    if job["posted_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only update your own job postings")
    
    # Update job data
    update_data = {
        "title": job_data.title,
        "company": job_data.company,
        "description": job_data.description,
        "required_skills": job_data.required_skills,
        "preferred_skills": job_data.preferred_skills,
        "location": job_data.location,
        "min_experience": job_data.min_experience,
        "max_experience": job_data.max_experience,
        "salary_min": job_data.salary_min,
        "salary_max": job_data.salary_max,
        "job_type": job_data.job_type,
    }
    
    # Use correct ID field for update
    filter_query = {"id": job_id} if "id" in job else {"_id": job["_id"]}
    
    # Update the document
    await db.jobs.update_one(filter_query, {"$set": update_data})
    
    # Get updated job
    updated_job = await db.jobs.find_one(filter_query)
    
    # Format for response
    updated_job["id"] = str(updated_job.get("_id", updated_job.get("id", "")))
    if "_id" in updated_job:
        del updated_job["_id"]
    updated_job["posted_by"] = str(updated_job["posted_by"])
    
    return {
        "success": True,
        "data": updated_job
    }

@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a job posting"""
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can delete jobs")
    
    db = get_database()
    
    # Find the job
    job = await db.jobs.find_one({"id": job_id})
    
    # If not found by id, try _id (if valid ObjectId)
    if not job:
        try:
            from bson.objectid import ObjectId
            if ObjectId.is_valid(job_id):
                job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        except ImportError:
            pass
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Verify ownership
    if job["posted_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own job postings")
    
    # Use correct ID field for deletion
    filter_query = {"id": job_id} if "id" in job else {"_id": job["_id"]}
    
    # Delete the job
    await db.jobs.delete_one(filter_query)
    
    return {
        "success": True,
        "message": "Job deleted successfully"
    }

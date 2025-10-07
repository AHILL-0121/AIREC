from fastapi import APIRouter, HTTPException, Query, Depends
from routes.auth import get_current_user
from typing import Optional
from services import indeed_api
from utils.db import get_database
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/search")
async def search_indeed_jobs(
    query: str,
    location: Optional[str] = "",
    limit: int = 10,
    page: int = 1,
    sort_by: str = "relevance",
    current_user: dict = Depends(get_current_user)
):
    """Search for jobs using the Indeed API"""
    
    # Only allow recruiters and admins to access this endpoint
    if current_user["role"] not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = indeed_api.search_jobs(query, location, limit, page, sort_by)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.get("/job/{job_id}")
async def get_indeed_job_details(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed information about a specific job from Indeed"""
    
    # Only allow recruiters and admins to access this endpoint
    if current_user["role"] not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = indeed_api.get_job_details(job_id)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.get("/publisher-data")
async def get_publisher_data(
    current_user: dict = Depends(get_current_user)
):
    """Get job trends and publisher data from Indeed"""
    
    # Only allow recruiters and admins to access this endpoint
    if current_user["role"] not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = indeed_api.get_publisher_data()
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.get("/recruiter/{recruiter_id}")
async def get_indeed_recruiter_details(
    recruiter_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get information about a specific recruiter from Indeed"""
    
    # Only allow recruiters and admins to access this endpoint
    if current_user["role"] not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = indeed_api.get_recruiter_details(recruiter_id)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

@router.post("/import/{job_id}")
async def import_indeed_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Import a job from Indeed to our platform"""
    
    # Only allow recruiters to import jobs
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can import jobs")
    
    # Get the job details from Indeed
    job_result = indeed_api.get_job_details(job_id)
    
    if not job_result["success"]:
        raise HTTPException(status_code=500, detail=job_result["error"])
    
    # Format the job for our platform
    formatted_job = indeed_api.import_job_to_platform(job_result["data"])
    
    # Add metadata for tracking
    job_id = str(uuid.uuid4())
    job_doc = {
        "id": job_id,
        "title": formatted_job["title"],
        "company": formatted_job["company"],
        "description": formatted_job["description"],
        "required_skills": formatted_job["required_skills"],
        "preferred_skills": formatted_job["preferred_skills"],
        "location": formatted_job["location"],
        "min_experience": formatted_job["min_experience"],
        "max_experience": formatted_job["max_experience"],
        "salary_min": formatted_job["salary_min"],
        "salary_max": formatted_job["salary_max"],
        "job_type": formatted_job["job_type"],
        "external_url": formatted_job["external_url"],
        "external_id": formatted_job["external_id"],
        "external_source": "indeed",
        "posted_by": current_user["id"],
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    # Save to database
    db = get_database()
    await db.jobs.insert_one(job_doc)
    
    # Remove MongoDB _id for response
    if "_id" in job_doc:
        del job_doc["_id"]
        
    return {
        "success": True,
        "message": "Job imported successfully",
        "data": job_doc
    }
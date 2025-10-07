from fastapi import APIRouter, HTTPException, Depends
from routes.auth import get_current_user
from utils.db import get_database
from datetime import datetime
from pydantic import BaseModel
import uuid
from typing import Optional

router = APIRouter()

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None

@router.post("")
async def create_application(
    data: ApplicationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a job application"""
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can apply for jobs")
    
    db = get_database()
    
    # Check if job exists - try both id field and MongoDB _id
    job = await db.jobs.find_one({"id": data.job_id})
    
    # If not found by id, try MongoDB _id (if valid ObjectId)
    if not job:
        try:
            from bson.objectid import ObjectId
            if ObjectId.is_valid(data.job_id):
                job = await db.jobs.find_one({"_id": ObjectId(data.job_id)})
        except ImportError:
            pass
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Use the job's consistent UUID id field, not the MongoDB _id
    job_uuid = job.get("id", str(job.get("_id", "")))
    
    # Check if already applied
    existing = await db.applications.find_one({
        "user_id": current_user["id"],
        "job_id": job_uuid
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")
    
    # Create application
    application_id = str(uuid.uuid4())
    
    application_doc = {
        "id": application_id,
        "user_id": current_user["id"],
        "job_id": job_uuid,
        "cover_letter": data.cover_letter,
        "status": "pending",  # pending, reviewed, rejected, accepted
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.applications.insert_one(application_doc)
    
    # Remove MongoDB _id
    if "_id" in application_doc:
        del application_doc["_id"]
    
    return {
        "success": True,
        "data": application_doc
    }

@router.get("/candidate")
async def get_candidate_applications(current_user: dict = Depends(get_current_user)):
    """Get applications for current candidate"""
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    # Get applications
    cursor = db.applications.find({"user_id": current_user["id"]})
    applications = await cursor.to_list(length=100)
    
    # Get job details for each application
    for app in applications:
        job = await db.jobs.find_one({"id": app["job_id"]})
        if job:
            job_copy = {k: v for k, v in job.items() if k != "_id"}
            app["job"] = job_copy
        app["id"] = str(app["_id"]) if "_id" in app else app["id"]
        if "_id" in app:
            del app["_id"]
    
    return {
        "success": True,
        "data": applications
    }

@router.get("/recruiter/recent")
async def get_recent_applications(current_user: dict = Depends(get_current_user)):
    """Get recent applications for jobs posted by the recruiter"""
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    # Get jobs posted by the recruiter
    cursor = db.jobs.find({"posted_by": current_user["id"]})
    jobs = await cursor.to_list(length=100)
    job_ids = [job["id"] for job in jobs]
    
    # Get recent applications for these jobs
    cursor = db.applications.find({"job_id": {"$in": job_ids}}).sort("created_at", -1).limit(10)
    applications = await cursor.to_list(length=10)
    
    # Get candidate and job details for each application
    for app in applications:
        # Add candidate info
        candidate = await db.users.find_one({"id": app["user_id"]})
        if candidate:
            # Remove sensitive info
            candidate_copy = {k: v for k, v in candidate.items() 
                             if k not in ["_id", "password"]}
            app["candidate"] = candidate_copy
        
        # Add job info
        job = await db.jobs.find_one({"id": app["job_id"]})
        if job:
            job_copy = {k: v for k, v in job.items() if k != "_id"}
            app["job"] = job_copy
            
        app["id"] = str(app["_id"]) if "_id" in app else app["id"]
        if "_id" in app:
            del app["_id"]
    
    return {
        "success": True,
        "data": applications
    }

@router.get("/recruiter/test")
async def test_endpoint():
    """Test endpoint to check if routing works"""
    return {"success": True, "message": "Test endpoint working", "data": []}

@router.get("/recruiter/{job_id}")
async def get_job_applications(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get applications for a specific job"""
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = get_database()
    
    # Check if job exists and belongs to the recruiter
    job = await db.jobs.find_one({"id": job_id, "posted_by": current_user["id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")
    
    # Get applications
    cursor = db.applications.find({"job_id": job_id})
    applications = await cursor.to_list(length=100)
    
    # Get candidate details for each application
    for app in applications:
        candidate = await db.users.find_one({"id": app["user_id"]})
        if candidate:
            # Remove sensitive info
            candidate_copy = {k: v for k, v in candidate.items() 
                             if k not in ["_id", "password"]}
            app["candidate"] = candidate_copy
        app["id"] = str(app["_id"]) if "_id" in app else app["id"]
        if "_id" in app:
            del app["_id"]
    
    return {
        "success": True,
        "data": applications
    }

@router.put("/{application_id}/status")
async def update_application_status(
    application_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update application status (recruiter only)"""
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can update application status")
    
    db = get_database()
    
    # Check if application exists
    application = await db.applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if job belongs to the recruiter
    job = await db.jobs.find_one({"id": application["job_id"]})
    if not job or job["posted_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate status
    valid_statuses = ["pending", "reviewed", "rejected", "accepted"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Update application
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "data": {"message": f"Application status updated to {status}"}
    }
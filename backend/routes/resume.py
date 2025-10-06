from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from routes.auth import get_current_user
from services.resume_parser import extract_text_from_pdf, parse_resume_with_ai
from utils.db import get_database
import os
import uuid
from pathlib import Path

router = APIRouter()

# Create uploads directory
UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = UPLOADS_DIR / f"{file_id}_{file.filename}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Extract text from PDF
    resume_text = extract_text_from_pdf(str(file_path))
    
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    # Parse resume with AI
    parsed_data = parse_resume_with_ai(resume_text)
    
    # Update user profile with parsed data
    db = get_database()
    update_data = {
        "skills": parsed_data.get("skills", []),
        "experience": parsed_data.get("experience_years", 0),
        "education": parsed_data.get("education", []),
        "achievements": parsed_data.get("achievements", []),
        "job_titles": parsed_data.get("job_titles", []),
        "resume_file": str(file_path),
        "profile_complete": True
    }
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "data": {
            "message": "Resume uploaded and parsed successfully",
            "parsed_data": parsed_data
        }
    }

@router.get("/parsed-data")
async def get_parsed_resume_data(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "skills": current_user.get("skills", []),
            "experience": current_user.get("experience", 0),
            "education": current_user.get("education", []),
            "achievements": current_user.get("achievements", []),
            "job_titles": current_user.get("job_titles", [])
        }
    }

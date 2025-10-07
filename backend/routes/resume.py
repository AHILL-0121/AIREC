from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from routes.auth import get_current_user
from services.resume_parser import extract_text_from_pdf, parse_resume_with_ai
from utils.db import get_database
import os
import uuid
from pathlib import Path
from datetime import datetime

router = APIRouter()

# Create uploads directory inside backend folder
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file exists and has a filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file content first to validate size
    content = await file.read()
    
    # Validate file size (limit to 10MB)
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File size too large (max 10MB)")
    
    # Create user-specific directory
    user_dir = UPLOADS_DIR / current_user["id"]
    user_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file with original filename (overwrite previous resume)
    file_path = user_dir / f"resume_{file.filename}"
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Extract text from PDF
    resume_text = extract_text_from_pdf(str(file_path))

    if not resume_text or resume_text.strip() == "":
        # Clean up the uploaded file if text extraction fails
        try:
            os.remove(file_path)
        except:
            pass
        raise HTTPException(
            status_code=400, 
            detail="Could not extract text from PDF. This may be an image-based PDF or the file may be corrupted. Please try uploading a text-based PDF or convert your document to text format."
        )

    # Get logger for this route
    from utils.logger import get_logger
    logger = get_logger("resume_route")
    
    # Import the OpenRouter detection function
    from services.resume_parser import IS_OPENROUTER_API_KEY
    
    # Parse resume with AI (service may be sync)
    try:
        parsed_data = await parse_resume_with_ai(resume_text) if callable(getattr(parse_resume_with_ai, "__await__", None)) else parse_resume_with_ai(resume_text)
        
        # Get the parsing method from the result
        parsing_method = parsed_data.get("parsing_method", "ai")
        parsing_method_msg = "OpenRouter AI" if "openrouter" in parsing_method else "Gemini AI"
        
        # Log successful parsing
        logger.info(f"Resume parsed successfully using {parsing_method_msg}")
        
        # Update user profile with comprehensive parsed data
        db = get_database()
        update_data = {
            "skills": parsed_data.get("skills", []),
            "experience": parsed_data.get("experience_years", 0),
            "education": parsed_data.get("education", []),
            "achievements": parsed_data.get("achievements", []),
            "job_titles": parsed_data.get("job_titles", []),
            "resume_file": str(file_path),
            "resume_filename": file.filename,
            "resume_uploaded_at": datetime.now().isoformat(),
            "profile_complete": True,
            # Additional profile details from resume
            "bio": parsed_data.get("summary", ""),
            "phone": parsed_data.get("phone", ""),
            "location": parsed_data.get("location", ""),
            "certifications": parsed_data.get("certifications", []),
            "languages": parsed_data.get("languages", []),
            "projects": parsed_data.get("projects", [])
        }
        
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "data": {
                "message": f"Resume uploaded and parsed successfully with {parsing_method_msg}",
                "parsed_data": parsed_data,
                "parsing_method": parsing_method
            }
        }
    except ValueError as e:
        # Log the error
        logger.error(f"AI parsing configuration error: {str(e)}")
        
        # Return a specific error for missing API key or configuration issues
        api_type = "OpenRouter" if IS_OPENROUTER_API_KEY else "Gemini"
        raise HTTPException(
            status_code=503, 
            detail=f"{api_type} API is required for resume parsing but is not properly configured. Please check your API key."
        )
    except Exception as e:
        # Log the error
        logger.error(f"Error in resume upload handler: {str(e)}")
        
        # Determine which AI service we're using for better error messages
        api_type = "OpenRouter" if IS_OPENROUTER_API_KEY else "Gemini"
        
        # Return a more specific error based on the service
        if "API" in str(e) or "key" in str(e).lower():
            raise HTTPException(
                status_code=503, 
                detail=f"{api_type} API service is currently unavailable or improperly configured. Please check your API key."
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to process resume with {api_type} API: {str(e)}"
            )

@router.get("/parsed-data")
async def get_parsed_resume_data(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "skills": current_user.get("skills", []),
            "experience": current_user.get("experience", 0),
            "education": current_user.get("education", []),
            "achievements": current_user.get("achievements", []),
            "job_titles": current_user.get("job_titles", []),
            "bio": current_user.get("bio", ""),
            "phone": current_user.get("phone", ""),
            "location": current_user.get("location", ""),
            "certifications": current_user.get("certifications", []),
            "languages": current_user.get("languages", []),
            "projects": current_user.get("projects", []),
            "resume_filename": current_user.get("resume_filename", ""),
            "resume_uploaded_at": current_user.get("resume_uploaded_at", "")
        }
    }

@router.get("/download/{user_id}")
async def download_candidate_resume(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Allow recruiters to download candidate resumes"""
    # Only recruiters can access this endpoint
    if current_user.get("role") != "recruiter":
        raise HTTPException(status_code=403, detail="Access denied. Only recruiters can download resumes.")
    
    # Get candidate information
    db = get_database()
    candidate = await db.users.find_one({"id": user_id, "role": "candidate"})
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Check if candidate has uploaded a resume
    resume_file = candidate.get("resume_file")
    if not resume_file:
        raise HTTPException(status_code=404, detail="Candidate has not uploaded a resume")
    
    # Construct file path
    file_path = Path(resume_file)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resume file not found")
    
    from fastapi.responses import FileResponse
    
    # Return the file
    return FileResponse(
        path=str(file_path),
        filename=candidate.get("resume_filename", "resume.pdf"),
        media_type="application/pdf"
    )

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from routes.auth import get_current_user
from services.resume_parser import extract_text_from_pdf, parse_resume_with_ai
from utils.db import get_database
import os
import uuid
from pathlib import Path

router = APIRouter()

# Create uploads directory inside backend folder
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

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
            "job_titles": current_user.get("job_titles", [])
        }
    }

# Test script for OpenRouter integration

import os
import sys
import json

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Simulate API key environment variables for testing
os.environ["GEMINI_API_KEY"] = "sk-or-v1-abcdef123456"  # Simulate an OpenRouter key for testing

# Import our parsers
from services.resume_parser import parse_resume_with_ai, extract_text_from_pdf
from services.openrouter_parser import is_openrouter_key, parse_resume_with_openrouter
from utils.logger import get_logger

# Get logger
logger = get_logger("test_openrouter")

def test_api_key_detection():
    # Test OpenRouter key detection
    sample_keys = {
        "sk-or-v1-abcdef123456": True,    # Should be detected as OpenRouter
        "sk-XYZ123456": False,            # Not an OpenRouter key
        "AIzaSyABC123DEF456": False,      # Not an OpenRouter key
        "sk-or-123456abcdef": True        # Should be detected as OpenRouter
    }
    
    for key, expected in sample_keys.items():
        result = is_openrouter_key(key)
        logger.info(f"Key {key}: Detected as OpenRouter = {result} (Expected {expected})")
        assert result == expected, f"OpenRouter detection failed for {key}"
    
    # Check actual environment key
    actual_key = os.environ.get("GEMINI_API_KEY", "")
    is_openrouter = is_openrouter_key(actual_key)
    logger.info(f"Environment API key is OpenRouter: {is_openrouter}")
    logger.info(f"Key starts with: {actual_key[:10]}..." if actual_key else "No API key found")

def test_resume_parsing():
    # Find an existing resume in the uploads directory
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    
    # Check if directory exists before listing files
    if not os.path.exists(uploads_dir):
        logger.error(f"Uploads directory not found at {uploads_dir}")
        return
        
    resume_files = [f for f in os.listdir(uploads_dir) if f.endswith('.pdf')]
    
    if not resume_files:
        logger.error("No resume files found in uploads directory")
        return
    
    test_resume = os.path.join(uploads_dir, resume_files[0])
    logger.info(f"Testing with resume: {test_resume}")
    
    # Extract text from PDF
    resume_text = extract_text_from_pdf(test_resume)
    
    if not resume_text:
        logger.error(f"Could not extract text from {test_resume}")
        return
    
    logger.info(f"Extracted {len(resume_text)} characters from resume")
    
    try:
        # Parse the resume
        logger.info("Attempting to parse resume...")
        parsed_data = parse_resume_with_ai(resume_text)
        
        # Log results
        logger.info(f"Resume parsed successfully using {parsed_data.get('parsing_method', 'unknown')}")
        logger.info(f"Found {len(parsed_data.get('skills', []))} skills")
        logger.info(f"Found {len(parsed_data.get('job_titles', []))} job titles")
        logger.info(f"Experience years: {parsed_data.get('experience_years', 0)}")
        logger.info(f"Education entries: {len(parsed_data.get('education', []))}")
        
        # Print the parsed data
        print(json.dumps(parsed_data, indent=2))
        
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting OpenRouter integration tests")
    
    # Run tests
    test_api_key_detection()
    test_resume_parsing()
    
    logger.info("Tests completed")
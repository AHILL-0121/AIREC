import google.generativeai as genai
import os
import json
import PyPDF2
import logging
import re
from utils.logger import get_logger
from utils.env_utils import get_api_key, is_openrouter_key
from services.openrouter_parser import parse_resume_with_openrouter

# Get logger
logger = get_logger("resume_parser")

# Configure Gemini AI
GEMINI_API_KEY = get_api_key('GEMINI_API_KEY')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-pro-latest')  # Default to latest model
logger.info(f"Configured to use model: {GEMINI_MODEL}")

# Check if using OpenRouter API key
IS_OPENROUTER_API_KEY = is_openrouter_key(GEMINI_API_KEY)
if IS_OPENROUTER_API_KEY:
    logger.info("Detected OpenRouter API key - will use OpenRouter integration")

# List of models to try in order if the configured one fails
FALLBACK_MODELS = [
    'gemini-pro', 
    'gemini-1.0-pro', 
    'gemini-1.5-pro',
    'gemini-pro-latest',
    'gemini-flash-latest',
    'gemini-2.0-pro',
    'gemini-2.5-pro'
]

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Gemini API configured successfully")
    except Exception as e:
        logger.error(f"Error configuring Gemini API: {e}")
else:
    logger.warning("GEMINI_API_KEY not found in environment variables. Resume parsing will use manual extraction.")

def parse_resume_with_ai(resume_text: str) -> dict:
    """
    Parse resume text using Gemini AI or OpenRouter API to extract structured data.
    Raises an error if neither API is available or fails.
    """
    if not GEMINI_API_KEY:
        logger.error("API key not configured. Resume parsing requires Gemini or OpenRouter API.")
        raise ValueError("API key not configured. Cannot parse resume.")

    # If using OpenRouter API key, use dedicated OpenRouter parser
    if IS_OPENROUTER_API_KEY:
        logger.info("Using OpenRouter API for resume parsing")
        try:
            return parse_resume_with_openrouter(resume_text)
        except Exception as e:
            logger.error(f"OpenRouter parsing failed: {str(e)}")
            raise  # Re-raise the exception to be handled by the caller
    
    # Otherwise use Gemini API (Google's API)
    try:
        # Setup for safety settings to improve success rate
        try:
            from google.generativeai.types import HarmCategory, HarmBlockThreshold
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            }
        except Exception:
            safety_settings = None
            
        # First, try the configured model
        all_models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL]
        
        model = None
        model_name = None
        last_error = None
        
        for model_name_to_try in all_models_to_try:
            try:
                logger.info(f"Attempting to use model: {model_name_to_try}")
                model = genai.GenerativeModel(model_name_to_try)
                
                # Quick test to see if model works
                test_response = model.generate_content(
                    "Return the text 'OK'",
                    safety_settings=safety_settings,
                    request_options={"timeout": 10}
                )
                
                # If we get here without error, model works
                logger.info(f"Successfully connected to model: {model_name_to_try}")
                model_name = model_name_to_try
                break
                
            except Exception as e:
                logger.warning(f"Failed to use model {model_name_to_try}: {e}")
                last_error = e
        
        # If no models worked, raise error
        if model is None:
            logger.error(f"All models failed. Last error: {last_error}")
            raise ValueError(f"No working Gemini models found: {last_error}")
            
        # Truncate resume text if too long (keep first 2000 chars)
        resume_text_truncated = resume_text[:2000] if len(resume_text) > 2000 else resume_text
        
        # Create an enhanced prompt to extract comprehensive profile information
        prompt = f"""Extract key information from this resume text.
        
Resume text:
{resume_text_truncated}

Extract and return ONLY a JSON object with this exact structure:
{{
  "skills": ["skill1", "skill2"],
  "experience_years": 0,
  "education": [
    {{
      "degree": "",
      "institution": "",
      "year": ""
    }}
  ],
  "achievements": ["achievement1"],
  "job_titles": ["title1"],
  "summary": "brief professional summary",
  "phone": "phone number if found",
  "location": "city, state/country if found", 
  "certifications": ["cert1", "cert2"],
  "languages": ["language1", "language2"],
  "projects": [
    {{
      "name": "project name",
      "description": "brief description",
      "technologies": ["tech1", "tech2"]
    }}
  ]
}}

Instructions:
- Extract technical skills, soft skills, and tools/technologies
- Calculate years of experience from work history
- Include all degrees and certifications
- Extract contact information if available
- Include notable achievements and accomplishments
- List job titles/roles held
- Extract project details if mentioned
- For missing fields, use empty strings or empty arrays
- Return valid JSON only, no explanations."""
        
        logger.info("Sending request to Gemini API")
        
        # Use request_options to set shorter timeout to avoid hanging
        # No try-except - let any errors propagate up
        response = model.generate_content(
            prompt,
            safety_settings=safety_settings,
            generation_config={"temperature": 0},  # Lower temperature for more deterministic results
            request_options={"timeout": 30}
        )
        
        # Parse JSON response
        response_text = response.text.strip()
        
        # Try to find JSON in response (handle markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Additional clean-up: Find anything that looks like JSON with curly braces
        json_pattern = r'({[\s\S]*})'
        json_match = re.search(json_pattern, response_text)
        if json_match:
            response_text = json_match.group(1)
            
        logger.debug(f"Gemini response received and processed")
        
        # No fallback - let JSON parsing errors propagate up
        parsed_data = json.loads(response_text)
        
        # Validate and clean data
        if "skills" not in parsed_data:
            parsed_data["skills"] = []
        if "experience_years" not in parsed_data:
            parsed_data["experience_years"] = 0
        if "education" not in parsed_data:
            parsed_data["education"] = []
        if "achievements" not in parsed_data:
            parsed_data["achievements"] = []
        if "job_titles" not in parsed_data:
            parsed_data["job_titles"] = []
            
        # Add parsing method info
        parsed_data["parsing_method"] = "gemini_ai"
        
        logger.info("Resume parsed successfully with Gemini AI")
        return parsed_data
    
    except Exception as e:
        # Log the error with detailed information and raise it
        logger.error(f"Gemini AI parsing error: {str(e)}")
        raise  # Re-raise the exception to be handled by the caller

def extract_skills_fallback(text: str) -> list:
    """Fallback skill extraction using keywords"""
    common_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue",
        "Node.js", "Express", "Django", "Flask", "FastAPI",
        "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes",
        "Git", "CI/CD", "Jenkins", "GitHub Actions",
        "Machine Learning", "AI", "Data Science", "TensorFlow", "PyTorch",
        "HTML", "CSS", "REST API", "GraphQL",
        "Agile", "Scrum", "Project Management", "Leadership",
        "Communication", "Problem Solving", "Team Collaboration"
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in common_skills:
        if skill.lower() in text_lower:
            found_skills.append(skill)
    
    # Remove duplicates and return top 15
    return list(set(found_skills))[:15]

def extract_job_titles_fallback(text: str) -> list:
    """Fallback job title extraction using regex patterns and common job titles"""
    common_titles = [
        "Software Engineer", "Senior Software Engineer", "Software Developer", 
        "Full Stack Developer", "Frontend Developer", "Backend Developer",
        "DevOps Engineer", "Data Scientist", "Data Engineer", "Machine Learning Engineer",
        "Product Manager", "Project Manager", "Technical Lead", "Team Lead",
        "Engineering Manager", "CTO", "CEO", "Director", "VP of Engineering",
        "QA Engineer", "UI/UX Designer", "Database Administrator", "System Administrator",
        "Cloud Engineer", "Security Engineer", "Mobile Developer", "Android Developer",
        "iOS Developer", "Web Developer", "Network Engineer"
    ]
    
    # Patterns to extract job titles from typical resume formats
    patterns = [
        r'(?:^|\n)([A-Za-z\s]+(?:Engineer|Developer|Scientist|Analyst|Manager|Designer|Administrator|Architect|Lead|Director|VP|CTO|CEO))(?:\s*\||\sat\s|\n)',
        r'(?:^|\n)(?:Title|Position|Role):\s*([A-Za-z\s]+(?:Engineer|Developer|Scientist|Analyst|Manager|Designer|Administrator|Architect|Lead|Director|VP|CTO|CEO))',
        r'(?:^|\n)([A-Za-z\s]+(?:Engineer|Developer|Scientist|Analyst|Manager|Designer|Administrator|Architect|Lead|Director|VP|CTO|CEO))\s*\d{4}\s*-',
    ]
    
    found_titles = []
    
    # Extract from patterns
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        found_titles.extend([match.strip() for match in matches if match.strip()])
    
    # Look for known job titles
    for title in common_titles:
        if title.lower() in text.lower():
            found_titles.append(title)
    
    # Remove duplicates and similar titles (keep longest)
    unique_titles = []
    for title in sorted(found_titles, key=len, reverse=True):
        is_unique = True
        for unique_title in unique_titles:
            if title.lower() in unique_title.lower() or unique_title.lower() in title.lower():
                is_unique = False
                break
        if is_unique:
            unique_titles.append(title)
    
    return unique_titles[:5]  # Return top 5 job titles

def extract_experience_fallback(text: str) -> int:
    """Fallback experience extraction"""
    import re
    
    # Look for patterns like "5 years", "5+ years", "2020-2024", etc.
    patterns = [
        r'(\d+)\s*(?:\+)?\s*years?\s+(?:of\s+)?experience',
        r'experience\s+(?:of\s+)?(\d+)\s*(?:\+)?\s*years?',
        r'(\d{4})\s*-\s*(\d{4})',  # Year ranges like 2020-2024
        r'(\d{4})\s*-\s*present',  # 2020-present
    ]
    
    years = []
    
    # Try to find year patterns
    for pattern in patterns[:2]:
        matches = re.findall(pattern, text.lower())
        for match in matches:
            if isinstance(match, str):
                years.append(int(match))
    
    # Try to find year ranges
    year_range_pattern = r'(\d{4})\s*-\s*(\d{4}|present)'
    year_ranges = re.findall(year_range_pattern, text.lower())
    current_year = 2025  # Setting to 2025 for future-proofing
    for start, end in year_ranges:
        end_year = current_year if end.lower() == 'present' else int(end)
        start_year = int(start)
        if start_year <= current_year and start_year < end_year:  # Validate years
            years.append(end_year - start_year)
    
    return max(years) if years else 0

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            # Log PDF information for debugging
            logger = get_logger("resume_parser")
            logger.info(f"PDF has {len(pdf_reader.pages)} pages")
            
            for i, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                logger.info(f"Page {i+1} extracted {len(page_text)} characters")
                text += page_text + "\n"
            
            # Clean up the text
            text = text.strip()
            logger.info(f"Total extracted text length: {len(text)}")
            
            if len(text) == 0:
                logger.warning("No text could be extracted from PDF - may be image-based or corrupted")
            
            return text
    except Exception as e:
        logger = get_logger("resume_parser")
        logger.error(f"Error extracting PDF text: {e}")
        return ""

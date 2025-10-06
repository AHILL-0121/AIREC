import google.generativeai as genai
import os
import json
import PyPDF2

# Configure Gemini AI
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def parse_resume_with_ai(resume_text: str) -> dict:
    """
    Parse resume text using Gemini AI to extract structured data
    """
    if not GEMINI_API_KEY:
        return {
            "skills": [],
            "experience_years": 0,
            "education": [],
            "achievements": [],
            "job_titles": [],
            "raw_text": resume_text
        }
    
    model = genai.GenerativeModel('gemini-pro')
    
    # Truncate resume text if too long (keep first 4000 chars)
    resume_text_truncated = resume_text[:4000] if len(resume_text) > 4000 else resume_text
    
    prompt = f"""Extract information from this resume and return ONLY a JSON object. No explanations.

Resume:
{resume_text_truncated}

Return this exact JSON structure:
{{
    "skills": ["skill1", "skill2"],
    "experience_years": 0,
    "education": [{{"degree": "", "institution": "", "year": ""}}],
    "achievements": ["achievement1"],
    "job_titles": ["title1"]
}}"""
    
    try:
        # Use request_options to set longer timeout (600 seconds)
        response = model.generate_content(
            prompt,
            request_options={"timeout": 600}
        )
        
        # Parse JSON response
        response_text = response.text.strip()
        
        # Try to find JSON in response (handle markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
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
            
        return parsed_data
        
    except Exception as e:
        print(f"Gemini AI parsing error: {e}")
        # Fallback: Basic keyword extraction
        return {
            "skills": extract_skills_fallback(resume_text_truncated),
            "experience_years": extract_experience_fallback(resume_text_truncated),
            "education": [],
            "achievements": [],
            "job_titles": [],
            "raw_text": resume_text_truncated
        }

def extract_skills_fallback(text: str) -> list:
    """Fallback skill extraction using keywords"""
    common_skills = [
        "python", "java", "javascript", "react", "node", "sql", "mongodb",
        "aws", "docker", "kubernetes", "machine learning", "ai", "data science",
        "project management", "agile", "scrum", "git", "ci/cd", "leadership"
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in common_skills:
        if skill in text_lower:
            found_skills.append(skill.title())
    
    return found_skills[:10]  # Return top 10

def extract_experience_fallback(text: str) -> int:
    """Fallback experience extraction"""
    import re
    
    # Look for patterns like "5 years", "5+ years", etc.
    patterns = [
        r'(\d+)\s*(?:\+)?\s*years?\s+(?:of\s+)?experience',
        r'experience\s+(?:of\s+)?(\d+)\s*(?:\+)?\s*years?'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    
    return 0

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

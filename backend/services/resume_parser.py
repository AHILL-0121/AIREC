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
    for start, end in year_ranges:
        end_year = 2025 if end == 'present' else int(end)
        start_year = int(start)
        years.append(end_year - start_year)
    
    return max(years) if years else 0

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

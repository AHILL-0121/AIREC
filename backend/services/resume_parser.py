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
    
    prompt = f"""
    You are an expert resume parser. Analyze the following resume and extract structured information.
    Return ONLY a valid JSON object with the following structure:
    {{
        "skills": ["skill1", "skill2", ...],
        "experience_years": <number>,
        "education": [
            {{
                "degree": "degree name",
                "institution": "school name",
                "year": "year"
            }}
        ],
        "achievements": ["achievement1", "achievement2", ...],
        "job_titles": ["title1", "title2", ...]
    }}
    
    Resume Text:
    {resume_text}
    
    Return ONLY the JSON object, no additional text or explanation.
    """
    
    response = model.generate_content(prompt)
    
    try:
        # Parse JSON response
        parsed_data = json.loads(response.text)
        
        # Validate and clean data
        if "skills" not in parsed_data:
            parsed_data["skills"] = []
        if "experience_years" not in parsed_data:
            parsed_data["experience_years"] = 0
            
        return parsed_data
        
    except json.JSONDecodeError:
        # Fallback parsing if JSON is malformed
        return {
            "skills": [],
            "experience_years": 0,
            "education": [],
            "achievements": [],
            "job_titles": [],
            "raw_text": resume_text
        }

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

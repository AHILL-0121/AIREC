import requests
import json
import os
import logging
from utils.logger import get_logger
from utils.env_utils import get_api_key, is_openrouter_key

# Get logger
logger = get_logger("openrouter_parser")

# Configure OpenRouter API
OPENROUTER_API_KEY = get_api_key('GEMINI_API_KEY')  # Using the same env var for simplicity
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

def parse_resume_with_openrouter(resume_text: str) -> dict:
    """
    Parse resume text using OpenRouter API to extract structured data.
    Raises an error if OpenRouter API is not available or fails.
    """
    if not OPENROUTER_API_KEY:
        logger.error("OpenRouter API key not configured.")
        raise ValueError("API key not configured. Cannot parse resume.")
    
    if not is_openrouter_key(OPENROUTER_API_KEY):
        logger.error("Not a valid OpenRouter API key. Keys should start with 'sk-or-'")
        raise ValueError("Invalid OpenRouter API key format.")
    
    # Truncate resume text if too long
    resume_text_truncated = resume_text[:2000] if len(resume_text) > 2000 else resume_text
    
    # Create an enhanced prompt for comprehensive resume parsing
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

Format your entire response as valid JSON only. No explanations, no other text."""
    
    try:
        # Models to try in order (from fastest to most capable)
        models_to_try = [
            "google/gemini-1.5-pro",
            "anthropic/claude-3-sonnet",
            "anthropic/claude-3-haiku",
            "mistralai/mixtral-8x7b-instruct"
        ]
        
        for model in models_to_try:
            try:
                # Make request to OpenRouter API
                headers = {
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                data = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are a resume parser that extracts structured data from resumes."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1024
                }
                
                logger.info(f"Attempting to use OpenRouter with model: {model}")
                response = requests.post(
                    f"{OPENROUTER_BASE_URL}/chat/completions", 
                    headers=headers, 
                    json=data,
                    timeout=30
                )
                
                # Check if the request was successful
                response.raise_for_status()
                
                # Parse the response
                result = response.json()
                
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0].get("message", {}).get("content", "")
                    
                    # Try to extract JSON from the content
                    try:
                        # Try to extract JSON if it's wrapped in code blocks
                        if "```json" in content:
                            json_text = content.split("```json")[1].split("```")[0].strip()
                        elif "```" in content:
                            json_text = content.split("```")[1].split("```")[0].strip()
                        else:
                            json_text = content.strip()
                            
                        parsed_data = json.loads(json_text)
                        parsed_data["parsing_method"] = f"openrouter_{model.split('/')[-1]}"
                        logger.info(f"Successfully parsed resume using OpenRouter with model {model}")
                        return parsed_data
                    
                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse JSON from OpenRouter response with model {model}: {e}")
                        continue
                    
            except Exception as e:
                logger.warning(f"Failed to use OpenRouter with model {model}: {e}")
                continue
        
        # If we get here, all models failed
        raise ValueError("All OpenRouter models failed to parse the resume")
        
    except Exception as e:
        logger.error(f"OpenRouter parsing error: {str(e)}")
        raise ValueError(f"Failed to parse resume with OpenRouter: {str(e)}")
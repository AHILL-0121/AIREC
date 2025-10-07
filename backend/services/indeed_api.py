"""
Indeed API Integration Service
This service provides functionality to fetch job posts and recruiter details from Indeed API.
Uses both the direct API and publisher API for different endpoints.
"""
import os
import requests
import json
from typing import Dict, List, Optional
from utils.logger import get_logger

# Get logger
logger = get_logger("indeed_api")

# API configuration
INDEED_API_KEY = os.environ.get("INDEED_API_KEY")
INDEED_API_BASE_URL = "https://apis.indeed.com/v2"
INDEED_PUBLISHER_URL = "https://www.indeed.com/publisher"

def get_headers() -> Dict[str, str]:
    """Get the required headers for Indeed API calls"""
    return {
        "Authorization": f"Bearer {INDEED_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

def search_jobs(query: str, location: str = "", limit: int = 10, 
                page: int = 1, sort_by: str = "relevance") -> Dict:
    """
    Search for jobs using the Indeed API
    
    Args:
        query: Job search keywords
        location: Location to search in
        limit: Number of results per page (max 50)
        page: Page number
        sort_by: Sort method ("relevance" or "date")
        
    Returns:
        Dict containing job search results
    """
    if not INDEED_API_KEY:
        logger.error("Indeed API key not configured")
        return {"success": False, "error": "Indeed API not configured", "data": []}
    
    try:
        url = f"{INDEED_API_BASE_URL}/jobs/search"
        
        params = {
            "q": query,
            "limit": min(limit, 50),  # API limit is 50
            "page": page,
            "sort_by": sort_by
        }
        
        if location:
            params["l"] = location
            
        response = requests.get(url, headers=get_headers(), params=params)
        response.raise_for_status()
        
        data = response.json()
        logger.info(f"Successfully fetched {len(data.get('jobs', []))} jobs from Indeed API")
        
        return {
            "success": True,
            "data": data.get("jobs", []),
            "total": data.get("totalResults", 0),
            "page": page,
            "pages": data.get("totalPages", 1)
        }
    
    except requests.RequestException as e:
        logger.error(f"Error fetching jobs from Indeed API: {str(e)}")
        return {
            "success": False, 
            "error": f"API request failed: {str(e)}",
            "data": []
        }
    except Exception as e:
        logger.error(f"Unexpected error with Indeed API: {str(e)}")
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "data": []
        }
        
def get_publisher_data() -> Dict:
    """
    Get data from the Indeed Publisher API
    
    Returns:
        Dict containing publisher data and job trends
    """
    try:
        logger.info("Fetching data from Indeed Publisher API")
        url = INDEED_PUBLISHER_URL
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.get(url)
        response.raise_for_status()
        
        try:
            data = response.json()
            logger.info("Successfully fetched publisher data")
        except ValueError:
            # If not JSON, return the text content (the API might return HTML)
            data = {
                "content": response.text[:1000],  # Truncate long HTML responses
                "content_type": response.headers.get("Content-Type", "unknown")
            }
            logger.warning("Publisher API didn't return JSON, received different content type")
            
        return {
            "success": True,
            "data": data
        }
    except requests.RequestException as e:
        logger.error(f"Error fetching data from Indeed Publisher API: {str(e)}")
        return {
            "success": False,
            "error": f"Publisher API request failed: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error with Indeed Publisher API: {str(e)}")
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }

def get_job_details(job_id: str) -> Dict:
    """
    Get detailed information about a specific job
    
    Args:
        job_id: The Indeed job ID
        
    Returns:
        Dict containing job details
    """
    if not INDEED_API_KEY:
        logger.error("Indeed API key not configured")
        return {"success": False, "error": "Indeed API not configured"}
    
    try:
        url = f"{INDEED_API_BASE_URL}/jobs/{job_id}"
        
        response = requests.get(url, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        logger.info(f"Successfully fetched job details for job ID: {job_id}")
        
        return {
            "success": True,
            "data": data
        }
    
    except requests.RequestException as e:
        logger.error(f"Error fetching job details from Indeed API: {str(e)}")
        return {
            "success": False, 
            "error": f"API request failed: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error with Indeed API: {str(e)}")
        return {
            "success": False, 
            "error": f"Unexpected error: {str(e)}"
        }

def get_recruiter_details(recruiter_id: str) -> Dict:
    """
    Get information about a specific recruiter
    
    Args:
        recruiter_id: The Indeed recruiter ID
        
    Returns:
        Dict containing recruiter details
    """
    if not INDEED_API_KEY:
        logger.error("Indeed API key not configured")
        return {"success": False, "error": "Indeed API not configured"}
    
    try:
        url = f"{INDEED_API_BASE_URL}/recruiters/{recruiter_id}"
        
        response = requests.get(url, headers=get_headers())
        response.raise_for_status()
        
        data = response.json()
        logger.info(f"Successfully fetched recruiter details for ID: {recruiter_id}")
        
        return {
            "success": True,
            "data": data
        }
    
    except requests.RequestException as e:
        logger.error(f"Error fetching recruiter details from Indeed API: {str(e)}")
        return {
            "success": False, 
            "error": f"API request failed: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error with Indeed API: {str(e)}")
        return {
            "success": False, 
            "error": f"Unexpected error: {str(e)}"
        }

def import_job_to_platform(job_data: Dict) -> Dict:
    """
    Format Indeed job data for import to our platform
    
    Args:
        job_data: Job data from Indeed API
        
    Returns:
        Dict containing formatted job data for our platform
    """
    skills = []
    if "skills" in job_data:
        skills = job_data.get("skills", [])
    elif "requirements" in job_data:
        # Try to extract skills from requirements text
        from services.job_recommendation import extract_skills_from_text
        skills = extract_skills_from_text(job_data.get("requirements", ""))
    
    formatted_job = {
        "title": job_data.get("title", ""),
        "company": job_data.get("company", {}).get("name", ""),
        "location": job_data.get("location", {}).get("displayName", ""),
        "description": job_data.get("description", ""),
        "required_skills": skills,
        "preferred_skills": [],
        "job_type": job_data.get("employmentType", "FULL_TIME").lower().replace("_", "-"),
        "min_experience": 0,  # Default values
        "max_experience": 5,
        "salary_min": job_data.get("salary", {}).get("min", None),
        "salary_max": job_data.get("salary", {}).get("max", None),
        "external_url": job_data.get("url", ""),
        "external_id": job_data.get("id", ""),
        "external_source": "indeed"
    }
    
    return formatted_job
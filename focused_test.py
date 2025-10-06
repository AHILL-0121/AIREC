#!/usr/bin/env python3
"""
Focused test for the two failed components
"""

import requests
import json
import tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

BACKEND_URL = "https://skill-match-24.preview.emergentagent.com/api"

def test_job_creation():
    """Test job creation fix"""
    print("=== Testing Job Creation Fix ===")
    
    # First signup as recruiter
    recruiter_data = {
        "email": "test.recruiter@example.com",
        "password": "TestPass123!",
        "full_name": "Test Recruiter",
        "role": "recruiter"
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/signup", json=recruiter_data)
    if response.status_code != 200:
        print(f"❌ Recruiter signup failed: {response.status_code}")
        return
    
    token = response.json()["data"]["access_token"]
    
    # Test job creation
    job_data = {
        "title": "Test Data Scientist",
        "company": "Test Corp",
        "description": "Test job description",
        "required_skills": ["Python", "SQL"],
        "location": "Remote",
        "min_experience": 1,
        "max_experience": 5
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BACKEND_URL}/jobs", json=job_data, headers=headers)
    
    if response.status_code == 200:
        print("✅ Job creation: PASSED")
        return response.json()["data"]["id"]
    else:
        print(f"❌ Job creation: FAILED - {response.status_code}, {response.text}")
        return None

def test_resume_upload():
    """Test resume upload fix"""
    print("\n=== Testing Resume Upload Fix ===")
    
    # First signup as candidate
    candidate_data = {
        "email": "test.candidate@example.com",
        "password": "TestPass123!",
        "full_name": "Test Candidate",
        "role": "candidate"
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/signup", json=candidate_data)
    if response.status_code != 200:
        print(f"❌ Candidate signup failed: {response.status_code}")
        return
    
    token = response.json()["data"]["access_token"]
    
    # Create a proper PDF
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    c = canvas.Canvas(temp_file.name, pagesize=letter)
    c.drawString(100, 750, "TEST CANDIDATE")
    c.drawString(100, 730, "Software Engineer")
    c.drawString(100, 700, "SKILLS:")
    c.drawString(120, 680, "• Python")
    c.drawString(120, 660, "• Machine Learning")
    c.drawString(120, 640, "• SQL")
    c.drawString(100, 610, "EXPERIENCE:")
    c.drawString(120, 590, "• 2 years as Software Engineer")
    c.save()
    
    # Test upload
    headers = {"Authorization": f"Bearer {token}"}
    with open(temp_file.name, 'rb') as f:
        files = {'file': ('test_resume.pdf', f, 'application/pdf')}
        response = requests.post(f"{BACKEND_URL}/resume/upload", files=files, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            print("✅ Resume upload: PASSED")
            parsed_data = data.get("data", {}).get("parsed_data", {})
            print(f"   Parsed skills: {parsed_data.get('skills', [])}")
        else:
            print("❌ Resume upload: FAILED - No success in response")
    else:
        print(f"❌ Resume upload: FAILED - {response.status_code}, {response.text}")

if __name__ == "__main__":
    job_id = test_job_creation()
    test_resume_upload()
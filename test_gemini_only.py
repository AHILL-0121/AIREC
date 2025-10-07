"""
Test script to verify Gemini-only resume parsing
"""
import os
import sys
import requests
import json
import time

# Test endpoints
BASE_URL = "http://localhost:8000/api"

def test_resume_upload():
    """Test resume upload with no fallbacks"""
    print("Testing resume upload with Gemini-only parsing...")
    
    # Test login first
    login_data = {
        "email": "testcandidate@example.com",
        "password": "password123"
    }
    
    try:
        # Try to login
        print("Logging in...")
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json()["token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Try to upload resume
            print("Uploading resume...")
            resume_path = os.path.join("backend", "uploads", "76d2a03a-c37b-43ea-a8e3-a838f0d87b1c_resume.pdf")
            
            if os.path.exists(resume_path):
                with open(resume_path, "rb") as f:
                    files = {"file": (os.path.basename(resume_path), f, "application/pdf")}
                    upload_response = requests.post(f"{BASE_URL}/resume/upload", headers=headers, files=files)
                
                print(f"Response status code: {upload_response.status_code}")
                if upload_response.status_code == 200:
                    print("✅ Resume uploaded successfully with Gemini AI")
                    print(f"\nResponse: {json.dumps(upload_response.json(), indent=2)}")
                else:
                    print(f"❌ Resume upload failed: {upload_response.text}")
            else:
                print(f"❌ Test resume file not found at {resume_path}")
        else:
            print(f"❌ Login failed: {login_response.text}")
    
    except Exception as e:
        print(f"❌ Test error: {e}")

if __name__ == "__main__":
    # Wait a moment to make sure server is running
    print("Waiting for server to be ready...")
    time.sleep(2)
    test_resume_upload()
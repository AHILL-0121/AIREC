import requests
import json
import os

# Test the enhanced resume upload and profile features
base_url = "http://localhost:8000/api"

# Candidate token
candidate_headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MGQ0ZjRlYy1lMGYyLTRjNDktOGJmZS1jMThkMWU2OTVlOTIiLCJyb2xlIjoiY2FuZGlkYXRlIiwiZXhwIjoxNzYwNDI3OTA5fQ.lFdjuKrVyXTOq9B8kPlJTxLZu-xevYbLNqx3TrPfQkU"
}

# Recruiter token
recruiter_headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNzAzNWExOS1hNmFmLTQyZDYtOTAwZS01ZDMzNjY4Y2FhZjEiLCJyb2xlIjoicmVjcnVpdGVyIiwiZXhwIjoxNzYwNDE5ODA1fQ.PHhbATOLOfDqSdE9pWZ9iMQ839vnFPEKeAK-_lvzvwo"
}

def test_resume_upload():
    """Test resume upload with enhanced parsing"""
    print("=== Testing Enhanced Resume Upload ===")
    
    test_pdf = "test_resume.pdf"
    if os.path.exists(test_pdf):
        try:
            with open(test_pdf, 'rb') as f:
                files = {'file': (test_pdf, f, 'application/pdf')}
                response = requests.post(f"{base_url}/resume/upload", headers=candidate_headers, files=files)
                
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print("✅ Resume uploaded successfully!")
                    print(f"Parsed Data: {json.dumps(data['data']['parsed_data'], indent=2)}")
                else:
                    print(f"❌ Error: {response.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
    else:
        print("❌ Test PDF not found")
    print()

def test_get_parsed_data():
    """Test getting enhanced parsed resume data"""
    print("=== Testing Enhanced Parsed Data Retrieval ===")
    
    try:
        response = requests.get(f"{base_url}/resume/parsed-data", headers=candidate_headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Enhanced parsed data retrieved!")
            print(f"Profile Data: {json.dumps(data['data'], indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    print()

def test_recruiter_access():
    """Test recruiter access to candidate profile and resume"""
    print("=== Testing Recruiter Access to Candidate Data ===")
    
    candidate_id = "70d4f4ec-e0f2-4c49-8bfe-c18d1e695e92"
    
    # Test getting candidate profile
    try:
        response = requests.get(f"{base_url}/profile/candidate/{candidate_id}", headers=recruiter_headers)
        print(f"Profile access status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Recruiter can access candidate profile!")
            print(f"Candidate Profile: {json.dumps(data['data'], indent=2)}")
        else:
            print(f"❌ Profile access error: {response.text}")
    except Exception as e:
        print(f"❌ Profile access exception: {e}")
    
    # Test downloading candidate resume
    try:
        response = requests.get(f"{base_url}/resume/download/{candidate_id}", headers=recruiter_headers)
        print(f"Resume download status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Recruiter can download candidate resume!")
            print(f"Content-Type: {response.headers.get('content-type')}")
            print(f"Content-Length: {response.headers.get('content-length')} bytes")
        else:
            print(f"❌ Resume download error: {response.text}")
    except Exception as e:
        print(f"❌ Resume download exception: {e}")
    print()

def test_candidate_trying_recruiter_endpoints():
    """Test that candidates cannot access recruiter-only endpoints"""
    print("=== Testing Access Control (Candidate trying Recruiter endpoints) ===")
    
    candidate_id = "70d4f4ec-e0f2-4c49-8bfe-c18d1e695e92"
    
    # Candidate trying to access recruiter-only profile endpoint
    try:
        response = requests.get(f"{base_url}/profile/candidate/{candidate_id}", headers=candidate_headers)
        print(f"Profile access status: {response.status_code}")
        
        if response.status_code == 403:
            print("✅ Access control working - candidate blocked from recruiter endpoint")
        else:
            print(f"❌ Access control issue: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    print()

if __name__ == "__main__":
    print("Testing Enhanced Resume and Profile Features")
    print("=" * 50)
    
    test_resume_upload()
    test_get_parsed_data()
    test_recruiter_access()
    test_candidate_trying_recruiter_endpoints()
    
    print("Testing complete!")
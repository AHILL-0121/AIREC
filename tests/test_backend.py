import pytest
from fastapi.testclient import TestClient
import sys
import os
from pathlib import Path
import json

# Add the parent directory to the path so we can import the server module
sys.path.append(str(Path(__file__).parent.parent))

from backend.server import app

client = TestClient(app)

# Mock JWT token for testing
mock_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfaWQiLCJyb2xlIjoiY2FuZGlkYXRlIiwiZXhwIjoxNjcyNTI2MTMwfQ.mock_signature"

mock_candidate_headers = {"Authorization": f"Bearer {mock_token}"}
mock_recruiter_headers = {"Authorization": f"Bearer {mock_token.replace('candidate', 'recruiter')}"}

@pytest.fixture(autouse=True)
def mock_auth(monkeypatch):
    # Mock the get_current_user function
    async def mock_get_current_user(token: str = None):
        if "recruiter" in token:
            return {
                "id": "test_recruiter_id",
                "email": "test_recruiter@example.com",
                "role": "recruiter",
                "name": "Test Recruiter"
            }
        return {
            "id": "test_user_id",
            "email": "test@example.com",
            "role": "candidate",
            "name": "Test User"
        }
    
    # Apply the mock
    import sys
    sys.modules["routes.auth"].get_current_user = mock_get_current_user


def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_job_search():
    """Test job search endpoint"""
    response = client.get("/api/jobs/search?query=developer")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert data["success"] == True


def test_candidate_auth_required():
    """Test that authentication is required for candidate endpoints"""
    # Try to access without auth
    response = client.get("/api/profile")
    assert response.status_code == 401
    
    # Try with auth
    response = client.get("/api/profile", headers=mock_candidate_headers)
    assert response.status_code == 200


def test_recruiter_auth_required():
    """Test that authentication is required for recruiter endpoints"""
    # Try to access recruiter endpoint with candidate token
    response = client.post(
        "/api/jobs", 
        json={"title": "Test Job", "company": "Test Co", "location": "Remote"},
        headers=mock_candidate_headers
    )
    assert response.status_code == 403
    
    # Try with recruiter token
    response = client.post(
        "/api/jobs", 
        json={"title": "Test Job", "company": "Test Co", "location": "Remote"},
        headers=mock_recruiter_headers
    )
    assert response.status_code == 200


def test_resume_upload():
    """Test resume upload endpoint"""
    with open("test_resume.pdf", "wb") as f:
        f.write(b"mock pdf content")
    
    with open("test_resume.pdf", "rb") as f:
        response = client.post(
            "/api/resume/upload",
            files={"file": ("test_resume.pdf", f, "application/pdf")},
            headers=mock_candidate_headers
        )
    
    # Clean up
    if os.path.exists("test_resume.pdf"):
        os.remove("test_resume.pdf")
    
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert data["success"] == True


def test_ai_match_score():
    """Test AI match scoring endpoint"""
    response = client.get(
        "/api/ai-match/score/test_job_id",
        headers=mock_candidate_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert "data" in data


def test_skill_search():
    """Test skill search endpoint"""
    response = client.get("/api/skills?prefix=py")
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert isinstance(data["data"], list)


def test_application_flow():
    """Test the complete application flow"""
    # Candidate applies for a job
    job_id = "test_job_id"
    application_data = {
        "job_id": job_id,
        "cover_letter": "Test cover letter"
    }
    
    response = client.post(
        "/api/applications",
        json=application_data,
        headers=mock_candidate_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    application_id = data["data"]["id"]
    
    # Candidate can see their applications
    response = client.get(
        "/api/applications/candidate",
        headers=mock_candidate_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) > 0
    
    # Recruiter can update application status
    response = client.put(
        f"/api/applications/{application_id}/status?status=reviewed",
        headers=mock_recruiter_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
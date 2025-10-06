#!/usr/bin/env python3
"""
Comprehensive Backend Testing for AI Job Matching Platform
Tests all authentication, resume parsing, job management, AI matching, and analytics endpoints
"""

import requests
import json
import os
import tempfile
from pathlib import Path
import time

# Get backend URL from environment
BACKEND_URL = "https://skill-match-24.preview.emergentagent.com/api"

class JobMatchingTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.candidate_token = None
        self.recruiter_token = None
        self.candidate_user = None
        self.recruiter_user = None
        self.test_job_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message=""):
        """Log test result"""
        if success:
            self.results["passed"] += 1
            print(f"✅ {test_name}: PASSED")
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: FAILED - {message}")
    
    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n=== Testing Health Endpoints ===")
        
        try:
            # Test root endpoint
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Root endpoint", 
                              "AI Job Matching Platform API" in data.get("message", ""))
            else:
                self.log_result("Root endpoint", False, f"Status: {response.status_code}")
            
            # Test health endpoint
            response = requests.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health endpoint", data.get("status") == "healthy")
            else:
                self.log_result("Health endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Health endpoints", False, str(e))
    
    def test_authentication(self):
        """Test authentication flow"""
        print("\n=== Testing Authentication ===")
        
        # Test candidate signup with unique email
        import time
        timestamp = str(int(time.time()))
        candidate_data = {
            "email": f"alice.johnson.{timestamp}@example.com",
            "password": "SecurePass123!",
            "full_name": "Alice Johnson",
            "role": "candidate"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/signup", json=candidate_data)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "access_token" in data.get("data", {}):
                    self.candidate_token = data["data"]["access_token"]
                    self.candidate_user = data["data"]["user"]
                    self.log_result("Candidate signup", True)
                else:
                    self.log_result("Candidate signup", False, "No token in response")
            else:
                self.log_result("Candidate signup", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Candidate signup", False, str(e))
        
        # Test recruiter signup
        recruiter_data = {
            "email": "john.smith@techcorp.com",
            "password": "RecruiterPass456!",
            "full_name": "John Smith",
            "role": "recruiter"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/signup", json=recruiter_data)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "access_token" in data.get("data", {}):
                    self.recruiter_token = data["data"]["access_token"]
                    self.recruiter_user = data["data"]["user"]
                    self.log_result("Recruiter signup", True)
                else:
                    self.log_result("Recruiter signup", False, "No token in response")
            else:
                self.log_result("Recruiter signup", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Recruiter signup", False, str(e))
        
        # Test login
        login_data = {
            "email": "alice.johnson@example.com",
            "password": "SecurePass123!"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Login", data.get("success") and "access_token" in data.get("data", {}))
            else:
                self.log_result("Login", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Login", False, str(e))
        
        # Test invalid credentials
        try:
            invalid_login = {
                "email": "alice.johnson@example.com",
                "password": "wrongpassword"
            }
            response = requests.post(f"{self.base_url}/auth/login", json=invalid_login)
            self.log_result("Invalid credentials handling", response.status_code == 401)
        except Exception as e:
            self.log_result("Invalid credentials handling", False, str(e))
        
        # Test get profile
        if self.candidate_token:
            try:
                headers = {"Authorization": f"Bearer {self.candidate_token}"}
                response = requests.get(f"{self.base_url}/auth/me", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_result("Get profile", data.get("success") and "data" in data)
                else:
                    self.log_result("Get profile", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Get profile", False, str(e))
        
        # Test update profile
        if self.candidate_token:
            try:
                headers = {"Authorization": f"Bearer {self.candidate_token}"}
                profile_update = {
                    "skills": ["Python", "Machine Learning", "Data Analysis", "SQL"],
                    "experience": 3,
                    "location": "San Francisco, CA",
                    "bio": "Experienced data scientist with expertise in ML and analytics"
                }
                response = requests.put(f"{self.base_url}/auth/me", json=profile_update, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_result("Update profile", data.get("success"))
                else:
                    self.log_result("Update profile", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Update profile", False, str(e))
    
    def create_sample_pdf(self):
        """Create a sample PDF resume for testing"""
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            
            # Create temporary PDF file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            
            # Create PDF content
            c = canvas.Canvas(temp_file.name, pagesize=letter)
            c.drawString(100, 750, "ALICE JOHNSON")
            c.drawString(100, 730, "Data Scientist")
            c.drawString(100, 700, "SKILLS:")
            c.drawString(120, 680, "• Python, R, SQL")
            c.drawString(120, 660, "• Machine Learning, Deep Learning")
            c.drawString(120, 640, "• Data Visualization, Tableau")
            c.drawString(100, 610, "EXPERIENCE:")
            c.drawString(120, 590, "• 3 years as Data Scientist at TechCorp")
            c.drawString(120, 570, "• Built ML models for customer analytics")
            c.drawString(100, 540, "EDUCATION:")
            c.drawString(120, 520, "• MS in Data Science, Stanford University")
            c.save()
            
            return temp_file.name
        except ImportError:
            # Fallback: create a simple text file as PDF (for testing purposes)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf', mode='w')
            temp_file.write("ALICE JOHNSON\nData Scientist\nSkills: Python, Machine Learning, SQL\nExperience: 3 years")
            temp_file.close()
            return temp_file.name
    
    def test_resume_upload(self):
        """Test resume upload and AI parsing"""
        print("\n=== Testing Resume Upload & AI Parsing ===")
        
        if not self.candidate_token:
            self.log_result("Resume upload", False, "No candidate token available")
            return
        
        # Create sample PDF
        pdf_path = self.create_sample_pdf()
        
        try:
            headers = {"Authorization": f"Bearer {self.candidate_token}"}
            
            # Test PDF upload
            with open(pdf_path, 'rb') as f:
                files = {'file': ('resume.pdf', f, 'application/pdf')}
                response = requests.post(f"{self.base_url}/resume/upload", 
                                       files=files, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "parsed_data" in data.get("data", {}):
                    parsed_data = data["data"]["parsed_data"]
                    self.log_result("Resume upload and parsing", True)
                    print(f"   Parsed skills: {parsed_data.get('skills', [])}")
                    print(f"   Experience years: {parsed_data.get('experience_years', 0)}")
                else:
                    self.log_result("Resume upload and parsing", False, "No parsed data in response")
            else:
                self.log_result("Resume upload and parsing", False, f"Status: {response.status_code}, Response: {response.text}")
            
            # Test non-PDF file rejection
            try:
                with tempfile.NamedTemporaryFile(suffix='.txt', mode='w') as txt_file:
                    txt_file.write("This is not a PDF")
                    txt_file.flush()
                    
                    with open(txt_file.name, 'rb') as f:
                        files = {'file': ('resume.txt', f, 'text/plain')}
                        response = requests.post(f"{self.base_url}/resume/upload", 
                                               files=files, headers=headers)
                    
                    self.log_result("Non-PDF file rejection", response.status_code == 400)
            except Exception as e:
                self.log_result("Non-PDF file rejection", False, str(e))
            
            # Test get parsed data
            try:
                response = requests.get(f"{self.base_url}/resume/parsed-data", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_result("Get parsed resume data", data.get("success"))
                else:
                    self.log_result("Get parsed resume data", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Get parsed resume data", False, str(e))
                
        except Exception as e:
            self.log_result("Resume upload", False, str(e))
        finally:
            # Clean up temp file
            try:
                os.unlink(pdf_path)
            except:
                pass
    
    def test_job_management(self):
        """Test job creation, search, and management"""
        print("\n=== Testing Job Management ===")
        
        if not self.recruiter_token:
            self.log_result("Job management", False, "No recruiter token available")
            return
        
        # Test job creation
        job_data = {
            "title": "Senior Data Scientist",
            "company": "TechCorp Inc",
            "description": "We are looking for an experienced data scientist to join our AI team. You will work on cutting-edge machine learning projects and help drive data-driven decisions across the organization.",
            "required_skills": ["Python", "Machine Learning", "SQL", "TensorFlow", "Statistics"],
            "location": "San Francisco, CA",
            "min_experience": 2,
            "max_experience": 8,
            "salary_range": "$120,000 - $180,000"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.recruiter_token}"}
            response = requests.post(f"{self.base_url}/jobs", json=job_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    self.test_job_id = data["data"]["id"]
                    self.log_result("Job creation", True)
                else:
                    self.log_result("Job creation", False, "No job data in response")
            else:
                self.log_result("Job creation", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Job creation", False, str(e))
        
        # Test candidate cannot create job
        if self.candidate_token:
            try:
                headers = {"Authorization": f"Bearer {self.candidate_token}"}
                response = requests.post(f"{self.base_url}/jobs", json=job_data, headers=headers)
                self.log_result("Candidate job creation restriction", response.status_code == 403)
            except Exception as e:
                self.log_result("Candidate job creation restriction", False, str(e))
        
        # Create additional jobs for better testing
        additional_jobs = [
            {
                "title": "Frontend Developer",
                "company": "WebTech Solutions",
                "description": "Looking for a skilled frontend developer with React experience.",
                "required_skills": ["JavaScript", "React", "CSS", "HTML", "TypeScript"],
                "location": "Remote",
                "min_experience": 1,
                "max_experience": 5,
                "salary_range": "$80,000 - $120,000"
            },
            {
                "title": "Machine Learning Engineer",
                "company": "AI Innovations",
                "description": "Join our ML team to build production ML systems.",
                "required_skills": ["Python", "Machine Learning", "Docker", "Kubernetes", "MLOps"],
                "location": "New York, NY",
                "min_experience": 3,
                "max_experience": 7,
                "salary_range": "$130,000 - $200,000"
            }
        ]
        
        for job in additional_jobs:
            try:
                headers = {"Authorization": f"Bearer {self.recruiter_token}"}
                requests.post(f"{self.base_url}/jobs", json=job, headers=headers)
            except:
                pass
        
        # Test job search
        try:
            # Search by query
            response = requests.get(f"{self.base_url}/jobs/search?query=data scientist")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Job search by query", data.get("success") and len(data.get("data", [])) > 0)
            else:
                self.log_result("Job search by query", False, f"Status: {response.status_code}")
            
            # Search by skills
            response = requests.get(f"{self.base_url}/jobs/search?skills=Python,Machine Learning")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Job search by skills", data.get("success"))
            else:
                self.log_result("Job search by skills", False, f"Status: {response.status_code}")
            
            # Search by location
            response = requests.get(f"{self.base_url}/jobs/search?location=San Francisco")
            if response.status_code == 200:
                data = response.json()
                self.log_result("Job search by location", data.get("success"))
            else:
                self.log_result("Job search by location", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Job search", False, str(e))
        
        # Test get specific job
        if self.test_job_id:
            try:
                response = requests.get(f"{self.base_url}/jobs/{self.test_job_id}")
                if response.status_code == 200:
                    data = response.json()
                    self.log_result("Get specific job", data.get("success"))
                else:
                    self.log_result("Get specific job", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Get specific job", False, str(e))
        
        # Test get recruiter's jobs
        if self.recruiter_token:
            try:
                headers = {"Authorization": f"Bearer {self.recruiter_token}"}
                response = requests.get(f"{self.base_url}/jobs/recruiter/my-jobs", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_result("Get recruiter jobs", data.get("success"))
                else:
                    self.log_result("Get recruiter jobs", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Get recruiter jobs", False, str(e))
        
        # Test job recommendations for candidate
        if self.candidate_token:
            try:
                headers = {"Authorization": f"Bearer {self.candidate_token}"}
                response = requests.get(f"{self.base_url}/jobs/recommendations", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    recommendations = data.get("data", [])
                    self.log_result("Job recommendations", data.get("success"))
                    if recommendations:
                        print(f"   Found {len(recommendations)} job recommendations")
                        for job in recommendations[:3]:
                            print(f"   - {job.get('title')} ({job.get('match_score', 0)}% match)")
                else:
                    self.log_result("Job recommendations", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Job recommendations", False, str(e))
    
    def test_ai_matching(self):
        """Test AI matching algorithm"""
        print("\n=== Testing AI Matching Algorithm ===")
        
        if not self.recruiter_token:
            self.log_result("AI matching", False, "No recruiter token available")
            return
        
        # Test run matching algorithm
        try:
            headers = {"Authorization": f"Bearer {self.recruiter_token}"}
            response = requests.post(f"{self.base_url}/ai-match/run", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    matches_count = data.get("data", {}).get("total_matches", 0)
                    self.log_result("Run matching algorithm", True)
                    print(f"   Generated {matches_count} matches")
                else:
                    self.log_result("Run matching algorithm", False, "Algorithm execution failed")
            else:
                self.log_result("Run matching algorithm", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Run matching algorithm", False, str(e))
        
        # Test candidate cannot run matching
        if self.candidate_token:
            try:
                headers = {"Authorization": f"Bearer {self.candidate_token}"}
                response = requests.post(f"{self.base_url}/ai-match/run", headers=headers)
                self.log_result("Candidate matching restriction", response.status_code == 403)
            except Exception as e:
                self.log_result("Candidate matching restriction", False, str(e))
        
        # Test get candidates for job
        if self.test_job_id and self.recruiter_token:
            try:
                headers = {"Authorization": f"Bearer {self.recruiter_token}"}
                response = requests.get(f"{self.base_url}/ai-match/candidates/{self.test_job_id}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("data", [])
                    self.log_result("Get ranked candidates", data.get("success"))
                    if candidates:
                        print(f"   Found {len(candidates)} ranked candidates")
                        for candidate in candidates[:3]:
                            print(f"   - {candidate.get('full_name')} ({candidate.get('match_score', 0)}% match)")
                else:
                    self.log_result("Get ranked candidates", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Get ranked candidates", False, str(e))
        
        # Test match score for candidate
        if self.test_job_id and self.candidate_token:
            try:
                headers = {"Authorization": f"Bearer {self.candidate_token}"}
                response = requests.get(f"{self.base_url}/ai-match/score/{self.test_job_id}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    score_data = data.get("data", {})
                    self.log_result("Get match score", data.get("success"))
                    print(f"   Match percentage: {score_data.get('match_percentage', 0)}%")
                    print(f"   Matched skills: {score_data.get('matched_skills', [])}")
                else:
                    self.log_result("Get match score", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Get match score", False, str(e))
    
    def test_analytics(self):
        """Test analytics endpoints"""
        print("\n=== Testing Analytics ===")
        
        # Test candidate dashboard
        if self.candidate_token:
            try:
                headers = {"Authorization": f"Bearer {self.candidate_token}"}
                response = requests.get(f"{self.base_url}/analytics/dashboard", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    dashboard_data = data.get("data", {})
                    self.log_result("Candidate dashboard", data.get("success"))
                    print(f"   Active jobs: {dashboard_data.get('total_active_jobs', 0)}")
                    print(f"   Recommended matches: {dashboard_data.get('recommended_matches', 0)}")
                else:
                    self.log_result("Candidate dashboard", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Candidate dashboard", False, str(e))
        
        # Test recruiter dashboard
        if self.recruiter_token:
            try:
                headers = {"Authorization": f"Bearer {self.recruiter_token}"}
                response = requests.get(f"{self.base_url}/analytics/dashboard", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    dashboard_data = data.get("data", {})
                    self.log_result("Recruiter dashboard", data.get("success"))
                    print(f"   Jobs posted: {dashboard_data.get('total_jobs_posted', 0)}")
                    print(f"   Total candidates: {dashboard_data.get('total_candidates', 0)}")
                else:
                    self.log_result("Recruiter dashboard", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Recruiter dashboard", False, str(e))
        
        # Test skill gap analysis
        if self.candidate_token:
            try:
                headers = {"Authorization": f"Bearer {self.candidate_token}"}
                response = requests.get(f"{self.base_url}/analytics/skill-gaps", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    skill_data = data.get("data", {})
                    self.log_result("Skill gap analysis", data.get("success"))
                    print(f"   Current skills: {len(skill_data.get('current_skills', []))}")
                    missing_skills = skill_data.get('missing_high_demand_skills', [])
                    if missing_skills:
                        print(f"   Top missing skills: {[s['skill'] for s in missing_skills[:3]]}")
                else:
                    self.log_result("Skill gap analysis", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Skill gap analysis", False, str(e))
        
        # Test bias report
        if self.recruiter_token:
            try:
                headers = {"Authorization": f"Bearer {self.recruiter_token}"}
                response = requests.get(f"{self.base_url}/analytics/bias-report", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    bias_data = data.get("data", {})
                    self.log_result("Bias report", data.get("success"))
                    print(f"   Total matches analyzed: {bias_data.get('total_matches', 0)}")
                    print(f"   Fairness index: {bias_data.get('fairness_index', 0)}")
                else:
                    self.log_result("Bias report", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Bias report", False, str(e))
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AI Job Matching Platform Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in order
        self.test_health_check()
        self.test_authentication()
        self.test_resume_upload()
        self.test_job_management()
        self.test_ai_matching()
        self.test_analytics()
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        
        if self.results["errors"]:
            print("\n🔍 FAILED TESTS:")
            for error in self.results["errors"]:
                print(f"   • {error}")
        
        success_rate = (self.results["passed"] / (self.results["passed"] + self.results["failed"])) * 100
        print(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        return self.results

if __name__ == "__main__":
    tester = JobMatchingTester()
    results = tester.run_all_tests()
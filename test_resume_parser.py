"""
Test script to directly test the resume_parser functionality
"""
import os
import sys
from backend.services.resume_parser import parse_resume_with_ai

# Sample resume text for testing
SAMPLE_RESUME = """
JOHN DOE
Software Engineer

CONTACT
Email: john.doe@example.com
Phone: (555) 123-4567
LinkedIn: linkedin.com/in/johndoe

SKILLS
Python, JavaScript, React, Node.js, Docker, AWS, MongoDB, PostgreSQL, Git

EXPERIENCE
Senior Software Engineer | ABC Tech | 2020 - Present
- Developed and maintained RESTful APIs using FastAPI and MongoDB
- Implemented CI/CD pipelines with GitHub Actions and Docker
- Led a team of 3 developers for a client-facing project

Software Engineer | XYZ Solutions | 2018 - 2020
- Built React frontend applications with Redux state management
- Created Node.js microservices deployed on AWS ECS
- Improved application performance by 30%

EDUCATION
Master of Science in Computer Science
University of Technology | 2016 - 2018

Bachelor of Science in Software Engineering
State University | 2012 - 2016

PROJECTS
Personal Website - Built with React and Next.js
Task Management App - MERN stack with GraphQL
"""

def test_resume_parser():
    """Test the resume parser with sample text"""
    print("Testing resume parser with sample resume text...")
    
    try:
        result = parse_resume_with_ai(SAMPLE_RESUME)
        print("\nParsing successful!")
        print("\nExtracted information:")
        print(f"- Skills: {result.get('skills', [])}")
        print(f"- Experience (years): {result.get('experience_years', 0)}")
        print(f"- Education: {result.get('education', [])}")
        print(f"- Job Titles: {result.get('job_titles', [])}")
        print(f"- Achievements: {result.get('achievements', [])}")
        print(f"\nParsing method: {result.get('parsing_method', 'unknown')}")
        
        if "error" in result:
            print(f"\nError encountered: {result['error']}")
        if "message" in result:
            print(f"\nMessage: {result['message']}")
        
        return True
    
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        return False

if __name__ == "__main__":
    test_resume_parser()
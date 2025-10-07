"""
Direct test for Gemini-only resume parser functionality
"""
import os
import sys
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("gemini_only_test")

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

def verify_gemini_only_behavior():
    """Test to verify the resume parser only uses Gemini API"""
    print("Testing Gemini-only resume parsing behavior...")
    
    # First, try without the API key to ensure it fails
    if "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]
    
    # Import after env var changes to ensure they take effect
    try:
        # Add parent directory to path so we can import backend module
        sys.path.insert(0, os.path.abspath("."))
        from backend.services.resume_parser import parse_resume_with_ai
        
        print("\nTest 1: No API Key (should fail)")
        try:
            result = parse_resume_with_ai(SAMPLE_RESUME)
            print("❌ Test failed: Parser should have raised an error without API key")
            return False
        except ValueError as e:
            print(f"✅ Correctly raised ValueError: {e}")
        except Exception as e:
            print(f"✅ Correctly failed with error: {e}")
        
        # Now set a dummy API key
        print("\nTest 2: With invalid API Key (should try to use Gemini and fail)")
        os.environ["GEMINI_API_KEY"] = "INVALID_API_KEY_FOR_TESTING"
        
        # Reload the module to pick up env var changes
        import importlib
        import google.generativeai
        importlib.reload(google.generativeai)
        
        # Reload our module
        import backend.services.resume_parser
        importlib.reload(backend.services.resume_parser)
        from backend.services.resume_parser import parse_resume_with_ai
        
        try:
            result = parse_resume_with_ai(SAMPLE_RESUME)
            print("❌ Test failed: Parser should have failed with invalid API key")
            return False
        except Exception as e:
            print(f"✅ Correctly failed with API error: {e}")
        
        print("\n✅ All tests passed - parser is now Gemini-only with no fallbacks!")
        return True
    
    except ImportError as e:
        print(f"❌ Failed to import resume_parser: {e}")
        return False

if __name__ == "__main__":
    verify_gemini_only_behavior()
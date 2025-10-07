"""
Standalone test script for resume parser that doesn't depend on the server
"""
import os
import sys
import re
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("resume_parser_test")

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

def extract_skills_fallback(text: str) -> list:
    """Fallback skill extraction using keywords"""
    common_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue",
        "Node.js", "Express", "Django", "Flask", "FastAPI",
        "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes",
        "Git", "CI/CD", "Jenkins", "GitHub Actions",
        "Machine Learning", "AI", "Data Science", "TensorFlow", "PyTorch",
        "HTML", "CSS", "REST API", "GraphQL",
        "Agile", "Scrum", "Project Management", "Leadership",
        "Communication", "Problem Solving", "Team Collaboration"
    ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in common_skills:
        if skill.lower() in text_lower:
            found_skills.append(skill)
    
    # Remove duplicates and return top 15
    return list(set(found_skills))[:15]

def extract_experience_fallback(text: str) -> int:
    """Fallback experience extraction"""
    
    # Look for patterns like "5 years", "5+ years", "2020-2024", etc.
    patterns = [
        r'(\d+)\s*(?:\+)?\s*years?\s+(?:of\s+)?experience',
        r'experience\s+(?:of\s+)?(\d+)\s*(?:\+)?\s*years?',
        r'(\d{4})\s*-\s*(\d{4})',  # Year ranges like 2020-2024
        r'(\d{4})\s*-\s*present',  # 2020-present
    ]
    
    years = []
    
    # Try to find year patterns
    for pattern in patterns[:2]:
        matches = re.findall(pattern, text.lower())
        for match in matches:
            if isinstance(match, str):
                years.append(int(match))
    
    # Try to find year ranges
    year_range_pattern = r'(\d{4})\s*-\s*(\d{4}|present)'
    year_ranges = re.findall(year_range_pattern, text.lower())
    current_year = 2025  # Setting to 2025 for future-proofing
    for start, end in year_ranges:
        end_year = current_year if end.lower() == 'present' else int(end)
        start_year = int(start)
        if start_year <= current_year and start_year < end_year:  # Validate years
            years.append(end_year - start_year)
    
    return max(years) if years else 0

def extract_job_titles_fallback(text: str) -> list:
    """Fallback job title extraction using regex patterns and common job titles"""
    common_titles = [
        "Software Engineer", "Senior Software Engineer", "Software Developer", 
        "Full Stack Developer", "Frontend Developer", "Backend Developer",
        "DevOps Engineer", "Data Scientist", "Data Engineer", "Machine Learning Engineer",
        "Product Manager", "Project Manager", "Technical Lead", "Team Lead",
        "Engineering Manager", "CTO", "CEO", "Director", "VP of Engineering",
        "QA Engineer", "UI/UX Designer", "Database Administrator", "System Administrator",
        "Cloud Engineer", "Security Engineer", "Mobile Developer", "Android Developer",
        "iOS Developer", "Web Developer", "Network Engineer"
    ]
    
    # Patterns to extract job titles from typical resume formats
    patterns = [
        r'(?:^|\n)([A-Za-z\s]+(?:Engineer|Developer|Scientist|Analyst|Manager|Designer|Administrator|Architect|Lead|Director|VP|CTO|CEO))(?:\s*\||\sat\s|\n)',
        r'(?:^|\n)(?:Title|Position|Role):\s*([A-Za-z\s]+(?:Engineer|Developer|Scientist|Analyst|Manager|Designer|Administrator|Architect|Lead|Director|VP|CTO|CEO))',
        r'(?:^|\n)([A-Za-z\s]+(?:Engineer|Developer|Scientist|Analyst|Manager|Designer|Administrator|Architect|Lead|Director|VP|CTO|CEO))\s*\d{4}\s*-',
    ]
    
    found_titles = []
    
    # Extract from patterns
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        found_titles.extend([match.strip() for match in matches if match.strip()])
    
    # Look for known job titles
    for title in common_titles:
        if title.lower() in text.lower():
            found_titles.append(title)
    
    # Remove duplicates and similar titles (keep longest)
    unique_titles = []
    for title in sorted(found_titles, key=len, reverse=True):
        is_unique = True
        for unique_title in unique_titles:
            if title.lower() in unique_title.lower() or unique_title.lower() in title.lower():
                is_unique = False
                break
        if is_unique:
            unique_titles.append(title)
    
    return unique_titles[:5]  # Return top 5 job titles

def test_fallback_functions():
    """Test the fallback functions without Gemini AI"""
    print("Testing fallback extraction functions...")
    
    try:
        skills = extract_skills_fallback(SAMPLE_RESUME)
        experience = extract_experience_fallback(SAMPLE_RESUME)
        job_titles = extract_job_titles_fallback(SAMPLE_RESUME)
        
        print("\nFallback extraction successful!")
        print("\nExtracted information:")
        print(f"- Skills: {skills}")
        print(f"- Experience (years): {experience}")
        print(f"- Job Titles: {job_titles}")
        
        # Create manual result dictionary 
        result = {
            "skills": skills,
            "experience_years": experience,
            "education": [],
            "achievements": [],
            "job_titles": job_titles,
            "parsing_method": "fallback",
            "message": "Resume processed with basic extraction"
        }
        
        print("\nFull result dictionary:")
        print(json.dumps(result, indent=2))
        
        return True
    
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        return False

if __name__ == "__main__":
    test_fallback_functions()
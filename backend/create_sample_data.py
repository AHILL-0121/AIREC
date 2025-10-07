import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.db import get_database

async def create_sample_jobs():
    """Create sample job data for testing"""
    db = get_database()
    
    # Sample jobs data
    sample_jobs = [
        {
            "id": "68e3e2037178ea51887be65c",
            "title": "Senior Python Developer",
            "company": "TechCorp Solutions",
            "location": "Remote",
            "salary_range": "$90,000 - $120,000",
            "job_type": "Full-time",
            "description": "We are looking for an experienced Python developer to join our growing team. You will work on building scalable web applications using modern Python frameworks.",
            "requirements": [
                "5+ years of Python development experience",
                "Experience with Django or FastAPI",
                "Knowledge of SQL databases",
                "Understanding of REST APIs",
                "Experience with cloud platforms (AWS, GCP, or Azure)"
            ],
            "benefits": [
                "Competitive salary",
                "Remote work flexibility",
                "Health insurance",
                "401k matching",
                "Professional development budget"
            ],
            "skills_required": ["Python", "Django", "FastAPI", "PostgreSQL", "AWS"],
            "posted_by": "recruiter123",
            "posted_date": "2024-01-15",
            "application_deadline": "2024-02-15",
            "status": "active"
        },
        {
            "id": "507f1f77bcf86cd799439011",
            "title": "Frontend React Developer", 
            "company": "Digital Innovations Inc",
            "location": "New York, NY",
            "salary_range": "$70,000 - $95,000",
            "job_type": "Full-time",
            "description": "Join our frontend team to build amazing user experiences using React and modern web technologies.",
            "requirements": [
                "3+ years of React development",
                "Experience with TypeScript",
                "Knowledge of state management (Redux/Context)",
                "Familiarity with testing frameworks",
                "Understanding of responsive design"
            ],
            "benefits": [
                "Competitive salary",
                "Office in Manhattan",
                "Flexible hours",
                "Health and dental insurance",
                "Stock options"
            ],
            "skills_required": ["React", "TypeScript", "JavaScript", "CSS", "HTML"],
            "posted_by": "recruiter456", 
            "posted_date": "2024-01-20",
            "application_deadline": "2024-02-20",
            "status": "active"
        },
        {
            "id": "507f1f77bcf86cd799439022",
            "title": "Full Stack Developer",
            "company": "StartupXYZ",
            "location": "San Francisco, CA", 
            "salary_range": "$85,000 - $110,000",
            "job_type": "Full-time",
            "description": "Work on both frontend and backend systems in a fast-paced startup environment.",
            "requirements": [
                "4+ years of full stack development",
                "Experience with Node.js and React",
                "Database design skills",
                "API development experience",
                "Startup experience preferred"
            ],
            "benefits": [
                "Equity package",
                "Unlimited PTO",
                "Health insurance",
                "Catered lunches",
                "Learning stipend"
            ],
            "skills_required": ["Node.js", "React", "MongoDB", "Express", "JavaScript"],
            "posted_by": "recruiter789",
            "posted_date": "2024-01-25", 
            "application_deadline": "2024-02-25",
            "status": "active"
        }
    ]
    
    try:
        # Clear existing jobs (optional - remove if you want to keep existing data)
        # await db.jobs.delete_many({})
        
        # Insert sample jobs
        result = await db.jobs.insert_many(sample_jobs)
        print(f"Successfully inserted {len(result.inserted_ids)} sample jobs")
        
        # Print the inserted job IDs
        for i, job_id in enumerate(result.inserted_ids):
            print(f"Job {i+1}: {sample_jobs[i]['title']} - ID: {sample_jobs[i]['id']}")
            
    except Exception as e:
        print(f"Error inserting sample jobs: {e}")

if __name__ == "__main__":
    asyncio.run(create_sample_jobs())
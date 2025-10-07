"""
Sample Data Injection Script for Job Matching Platform
This script creates multiple recruiters and jobs for testing purposes.
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from utils.auth import get_password_hash
import random

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "job_matching_db"

async def inject_sample_data():
    # Connect to database
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    print("Clearing existing data...")
    await db.users.delete_many({"role": "recruiter"})
    await db.jobs.delete_many({})
    
    # Sample recruiter data with credentials
    recruiters_data = [
        {
            "email": "sarah.johnson@techcorp.com",
            "password": "recruiter123",  # Will be hashed
            "full_name": "Sarah Johnson",
            "company": "TechCorp Solutions",
            "location": "San Francisco, CA",
            "bio": "Senior Technical Recruiter with 8 years of experience in tech hiring"
        },
        {
            "email": "mike.chen@innovatetech.com",
            "password": "password456",
            "full_name": "Michael Chen",
            "company": "InnovateTech Inc",
            "location": "New York, NY",
            "bio": "Lead Recruiter specializing in software engineering and data science roles"
        },
        {
            "email": "jessica.martinez@globalsoft.com",
            "password": "secure789",
            "full_name": "Jessica Martinez",
            "company": "GlobalSoft Technologies",
            "location": "Austin, TX",
            "bio": "Experienced recruiter focusing on full-stack development and DevOps"
        },
        {
            "email": "david.wilson@startupventures.com",
            "password": "recruit2024",
            "full_name": "David Wilson",
            "company": "StartupVentures",
            "location": "Seattle, WA",
            "bio": "Startup recruiter with expertise in early-stage company hiring"
        },
        {
            "email": "anna.kumar@cloudtech.com",
            "password": "hiring123",
            "full_name": "Anna Kumar",
            "company": "CloudTech Systems",
            "location": "Boston, MA",
            "bio": "Cloud infrastructure and security specialist recruiter"
        }
    ]
    
    # Create recruiters
    print("Creating recruiters...")
    created_recruiters = []
    
    for recruiter_data in recruiters_data:
        recruiter_id = str(uuid.uuid4())
        hashed_password = get_password_hash(recruiter_data["password"])
        
        recruiter_doc = {
            "id": recruiter_id,
            "email": recruiter_data["email"],
            "password": hashed_password,
            "full_name": recruiter_data["full_name"],
            "role": "recruiter",
            "company": recruiter_data["company"],
            "location": recruiter_data["location"],
            "bio": recruiter_data["bio"],
            "skills": [],
            "experience": random.randint(3, 10),
            "created_at": datetime.utcnow(),
            "profile_complete": True
        }
        
        await db.users.insert_one(recruiter_doc)
        created_recruiters.append({
            "id": recruiter_id,
            "email": recruiter_data["email"],
            "password": recruiter_data["password"],  # Store plain password for reference
            "company": recruiter_data["company"]
        })
        
        print(f"Created recruiter: {recruiter_data['email']} (Company: {recruiter_data['company']})")
    
    # Sample job templates
    job_templates = [
        {
            "title": "Senior Full Stack Developer",
            "description": "We are seeking an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing both front-end and back-end components of web applications, collaborating with cross-functional teams, and ensuring high-quality code delivery.",
            "required_skills": ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
            "preferred_skills": ["TypeScript", "Docker", "AWS", "GraphQL"],
            "job_type": "full-time",
            "min_experience": 4,
            "max_experience": 8,
            "salary_min": 90000,
            "salary_max": 130000
        },
        {
            "title": "Frontend React Developer",
            "description": "Join our frontend team to build amazing user interfaces using React. You'll work on modern web applications, optimize performance, and ensure excellent user experience across different devices and browsers.",
            "required_skills": ["React", "JavaScript", "CSS3", "HTML5", "Redux"],
            "preferred_skills": ["TypeScript", "Next.js", "Tailwind CSS", "Jest"],
            "job_type": "full-time",
            "min_experience": 2,
            "max_experience": 5,
            "salary_min": 70000,
            "salary_max": 100000
        },
        {
            "title": "Backend Python Developer",
            "description": "We're looking for a skilled Backend Developer to design and implement scalable server-side applications. You'll work with Python, build APIs, optimize databases, and ensure system reliability and performance.",
            "required_skills": ["Python", "Django", "PostgreSQL", "REST API", "Docker"],
            "preferred_skills": ["FastAPI", "Redis", "Celery", "AWS", "Kubernetes"],
            "job_type": "full-time",
            "min_experience": 3,
            "max_experience": 6,
            "salary_min": 80000,
            "salary_max": 120000
        },
        {
            "title": "DevOps Engineer",
            "description": "Seeking a DevOps Engineer to streamline our development and deployment processes. You'll manage CI/CD pipelines, cloud infrastructure, monitoring systems, and work closely with development teams to ensure smooth operations.",
            "required_skills": ["AWS", "Docker", "Kubernetes", "Jenkins", "Linux"],
            "preferred_skills": ["Terraform", "Ansible", "Prometheus", "GitLab CI", "Helm"],
            "job_type": "full-time",
            "min_experience": 3,
            "max_experience": 7,
            "salary_min": 85000,
            "salary_max": 125000
        },
        {
            "title": "Data Scientist",
            "description": "Join our data team to extract insights from complex datasets. You'll build machine learning models, perform statistical analysis, and help drive data-driven decision making across the organization.",
            "required_skills": ["Python", "Machine Learning", "SQL", "Pandas", "NumPy"],
            "preferred_skills": ["TensorFlow", "PyTorch", "Spark", "Tableau", "R"],
            "job_type": "full-time",
            "min_experience": 2,
            "max_experience": 6,
            "salary_min": 95000,
            "salary_max": 140000
        },
        {
            "title": "Mobile App Developer",
            "description": "Develop cross-platform mobile applications that delight users. You'll work with React Native or Flutter to create performant, beautiful mobile experiences for both iOS and Android platforms.",
            "required_skills": ["React Native", "JavaScript", "iOS", "Android", "Mobile UI"],
            "preferred_skills": ["Flutter", "Swift", "Kotlin", "Firebase", "App Store"],
            "job_type": "full-time",
            "min_experience": 2,
            "max_experience": 5,
            "salary_min": 75000,
            "salary_max": 110000
        },
        {
            "title": "UI/UX Designer",
            "description": "Create intuitive and visually appealing user interfaces. You'll conduct user research, design wireframes and prototypes, and collaborate with developers to bring designs to life.",
            "required_skills": ["Figma", "Adobe XD", "UI Design", "UX Research", "Prototyping"],
            "preferred_skills": ["Sketch", "InVision", "User Testing", "Design Systems", "HTML/CSS"],
            "job_type": "full-time",
            "min_experience": 2,
            "max_experience": 6,
            "salary_min": 65000,
            "salary_max": 95000
        },
        {
            "title": "Cybersecurity Analyst",
            "description": "Protect our organization from cyber threats. You'll monitor security systems, investigate incidents, implement security measures, and ensure compliance with security policies and regulations.",
            "required_skills": ["Network Security", "SIEM", "Incident Response", "Risk Assessment", "Compliance"],
            "preferred_skills": ["CISSP", "Penetration Testing", "Cloud Security", "SOC", "Threat Intelligence"],
            "job_type": "full-time",
            "min_experience": 2,
            "max_experience": 7,
            "salary_min": 80000,
            "salary_max": 120000
        }
    ]
    
    # Location options
    locations = [
        "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", 
        "Boston, MA", "Remote", "Chicago, IL", "Los Angeles, CA", "Denver, CO"
    ]
    
    # Create jobs for each recruiter
    print("\nCreating jobs...")
    total_jobs_created = 0
    
    for recruiter in created_recruiters:
        # Each recruiter gets 3-5 jobs
        num_jobs = random.randint(3, 5)
        
        # Select random job templates for this recruiter
        selected_templates = random.sample(job_templates, min(num_jobs, len(job_templates)))
        
        for i, template in enumerate(selected_templates):
            job_id = str(uuid.uuid4())
            
            # Customize job based on template and recruiter
            job_doc = {
                "id": job_id,
                "title": template["title"],
                "company": recruiter["company"],
                "description": template["description"],
                "required_skills": template["required_skills"],
                "preferred_skills": template["preferred_skills"],
                "location": random.choice(locations),
                "min_experience": template["min_experience"],
                "max_experience": template["max_experience"],
                "salary_min": template["salary_min"],
                "salary_max": template["salary_max"],
                "job_type": template["job_type"],
                "posted_by": recruiter["id"],
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                "status": "active"
            }
            
            await db.jobs.insert_one(job_doc)
            total_jobs_created += 1
            
            print(f"Created job: {template['title']} at {recruiter['company']}")
    
    print(f"\n✅ Sample data injection completed!")
    print(f"📊 Summary:")
    print(f"   - Created {len(created_recruiters)} recruiters")
    print(f"   - Created {total_jobs_created} jobs")
    
    print(f"\n🔐 Recruiter Credentials:")
    print("=" * 60)
    for recruiter in created_recruiters:
        print(f"Email: {recruiter['email']}")
        print(f"Password: {recruiter['password']}")
        print(f"Company: {recruiter['company']}")
        print("-" * 40)
    
    # Close connection
    client.close()

if __name__ == "__main__":
    print("🚀 Starting sample data injection...")
    asyncio.run(inject_sample_data())
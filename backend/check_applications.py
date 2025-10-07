#!/usr/bin/env python3

import asyncio
from utils.db import get_database

async def check_applications():
    db = get_database()
    
    print("=== Checking Applications ===")
    
    # Get all applications
    applications = await db.applications.find().to_list(length=100)
    print(f"Total applications in database: {len(applications)}")
    
    for i, app in enumerate(applications, 1):
        print(f"\nApplication {i}:")
        print(f"  Application ID: {app.get('id', 'N/A')}")
        print(f"  User ID: {app.get('user_id', 'N/A')}")
        print(f"  Job ID: {app.get('job_id', 'N/A')}")
        print(f"  Status: {app.get('status', 'N/A')}")
        print(f"  Created: {app.get('created_at', 'N/A')}")
        print(f"  MongoDB _id: {app.get('_id', 'N/A')}")
    
    print("\n=== Checking Jobs ===")
    
    # Get all jobs
    jobs = await db.jobs.find().to_list(length=100)
    print(f"Total jobs in database: {len(jobs)}")
    
    for i, job in enumerate(jobs, 1):
        print(f"\nJob {i}:")
        print(f"  Job ID: {job.get('id', 'N/A')}")
        print(f"  Title: {job.get('title', 'N/A')}")
        print(f"  Posted by: {job.get('posted_by', 'N/A')}")
        print(f"  Company: {job.get('company', 'N/A')}")
        print(f"  MongoDB _id: {job.get('_id', 'N/A')}")
    
    print("\n=== Checking Users ===")
    
    # Get all users
    users = await db.users.find().to_list(length=100)
    print(f"Total users in database: {len(users)}")
    
    recruiters = [u for u in users if u.get('role') == 'recruiter']
    candidates = [u for u in users if u.get('role') == 'candidate']
    
    print(f"Recruiters: {len(recruiters)}")
    for recruiter in recruiters:
        print(f"  - {recruiter.get('full_name', 'N/A')} ({recruiter.get('id', 'N/A')})")
    
    print(f"Candidates: {len(candidates)}")
    for candidate in candidates:
        print(f"  - {candidate.get('full_name', 'N/A')} ({candidate.get('id', 'N/A')})")

if __name__ == "__main__":
    asyncio.run(check_applications())
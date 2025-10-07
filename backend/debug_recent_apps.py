#!/usr/bin/env python3

import asyncio
from utils.db import get_database

async def debug_recent_applications():
    db = get_database()
    
    print("=== Debugging Recent Applications Endpoint ===")
    
    # Check Sarah Johnson (the recruiter we see in the dashboard)
    sarah_id = "f7035a19-a6af-42d6-900e-5d33668caaf1"
    
    print(f"\nDebugging for Sarah Johnson ({sarah_id}):")
    
    # Step 1: Get jobs posted by Sarah
    cursor = db.jobs.find({"posted_by": sarah_id})
    sarah_jobs = await cursor.to_list(length=100)
    print(f"Jobs posted by Sarah: {len(sarah_jobs)}")
    
    sarah_job_ids = [job["id"] for job in sarah_jobs]
    print(f"Sarah's job IDs: {sarah_job_ids}")
    
    # Step 2: Get applications for these jobs
    cursor = db.applications.find({"job_id": {"$in": sarah_job_ids}})
    applications_for_sarah = await cursor.to_list(length=10)
    print(f"Applications for Sarah's jobs: {len(applications_for_sarah)}")
    
    for app in applications_for_sarah:
        print(f"  - Application {app.get('id')}: Job {app.get('job_id')}, User {app.get('user_id')}")
    
    print(f"\n=== Cross-checking all applications ===")
    
    # Get all applications and see which jobs they're for
    all_applications = await db.applications.find().to_list(length=100)
    print(f"Total applications: {len(all_applications)}")
    
    for app in all_applications:
        job_id = app.get('job_id')
        # Find which job this is
        job = await db.jobs.find_one({"id": job_id})
        if job:
            posted_by = job.get('posted_by')
            recruiter = await db.users.find_one({"id": posted_by})
            recruiter_name = recruiter.get('full_name') if recruiter else 'Unknown'
            print(f"  - App {app.get('id')}: Job '{job.get('title')}' by {recruiter_name} ({posted_by})")
        else:
            print(f"  - App {app.get('id')}: Job {job_id} NOT FOUND!")

if __name__ == "__main__":
    asyncio.run(debug_recent_applications())
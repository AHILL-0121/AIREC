"""
Check if specific job ID exists in database
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "job_matching_db"

async def check_job_id():
    # Connect to database
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    job_id = "68e49323a21e44e58343a699"
    print(f"🔍 Checking for job ID: {job_id}")
    
    # Check if this job exists by id field
    job_by_id = await db.jobs.find_one({"id": job_id})
    print(f"Found by 'id' field: {'YES' if job_by_id else 'NO'}")
    
    # Check if this job exists by _id field (MongoDB ObjectId)
    try:
        from bson.objectid import ObjectId
        if ObjectId.is_valid(job_id):
            job_by_mongodb_id = await db.jobs.find_one({"_id": ObjectId(job_id)})
            print(f"Found by '_id' field: {'YES' if job_by_mongodb_id else 'NO'}")
        else:
            print(f"Job ID '{job_id}' is not a valid MongoDB ObjectId")
    except Exception as e:
        print(f"Error checking MongoDB _id: {e}")
    
    # List some actual job IDs for comparison
    print(f"\n📋 First 5 jobs in database:")
    jobs = await db.jobs.find({}).limit(5).to_list(length=5)
    for i, job in enumerate(jobs):
        print(f"{i+1}. ID: {job.get('id')}")
        print(f"   MongoDB _id: {job.get('_id')}")
        print(f"   Title: {job.get('title')}")
        print(f"   Company: {job.get('company')}")
        print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_job_id())
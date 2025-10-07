"""
Database Diagnostic Script
This script will check the database state and identify why Sarah Johnson's jobs aren't showing up
"""

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from utils.auth import get_password_hash, verify_password
import json

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "job_matching_db"

async def diagnose_database():
    # Connect to database
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 DATABASE DIAGNOSTIC REPORT")
    print("=" * 60)
    
    # 1. Check total collections and documents
    print("\n📊 COLLECTION OVERVIEW:")
    collections = await db.list_collection_names()
    print(f"Collections found: {collections}")
    
    for collection_name in collections:
        collection = db[collection_name]
        count = await collection.count_documents({})
        print(f"  - {collection_name}: {count} documents")
    
    # 2. Check Sarah Johnson's user record
    print("\n👤 SARAH JOHNSON USER ANALYSIS:")
    sarah_users = await db.users.find({"email": "sarah.johnson@techcorp.com"}).to_list(length=10)
    print(f"Found {len(sarah_users)} user(s) with email sarah.johnson@techcorp.com")
    
    if sarah_users:
        sarah = sarah_users[0]
        print(f"✅ Sarah Johnson found:")
        print(f"  - ID: {sarah.get('id', 'No ID field')}")
        print(f"  - MongoDB _id: {sarah.get('_id', 'No _id field')}")
        print(f"  - Full Name: {sarah.get('full_name')}")
        print(f"  - Company: {sarah.get('company')}")
        print(f"  - Role: {sarah.get('role')}")
        print(f"  - Created: {sarah.get('created_at')}")
        
        # Test password
        if 'password' in sarah:
            password_valid = verify_password("recruiter123", sarah['password'])
            print(f"  - Password 'recruiter123' valid: {password_valid}")
    else:
        print("❌ Sarah Johnson user NOT found!")
        return
    
    # 3. Check all jobs in database
    print("\n💼 JOBS ANALYSIS:")
    all_jobs = await db.jobs.find({}).to_list(length=100)
    print(f"Total jobs in database: {len(all_jobs)}")
    
    if all_jobs:
        print("\nJobs breakdown by company:")
        companies = {}
        for job in all_jobs:
            company = job.get('company', 'Unknown')
            if company not in companies:
                companies[company] = []
            companies[company].append({
                'title': job.get('title'),
                'posted_by': job.get('posted_by'),
                'id': job.get('id'),
                '_id': str(job.get('_id', ''))
            })
        
        for company, jobs in companies.items():
            print(f"\n  🏢 {company}: ({len(jobs)} jobs)")
            for job in jobs:
                print(f"    - {job['title']}")
                print(f"      Posted by ID: {job['posted_by']}")
                print(f"      Job ID: {job['id']}")
    
    # 4. Check Sarah's specific jobs
    print(f"\n🎯 SARAH'S JOBS CHECK:")
    sarah_id = sarah.get('id')
    sarah_mongodb_id = sarah.get('_id')
    
    # Try both ID formats
    jobs_by_id = await db.jobs.find({"posted_by": sarah_id}).to_list(length=100)
    jobs_by_mongodb_id = await db.jobs.find({"posted_by": sarah_mongodb_id}).to_list(length=100)
    
    print(f"Jobs found using sarah.id ({sarah_id}): {len(jobs_by_id)}")
    print(f"Jobs found using sarah._id ({sarah_mongodb_id}): {len(jobs_by_mongodb_id)}")
    
    if jobs_by_id:
        print("\n✅ Jobs found using UUID ID:")
        for job in jobs_by_id:
            print(f"  - {job['title']} at {job['company']}")
    
    if jobs_by_mongodb_id:
        print("\n✅ Jobs found using MongoDB _id:")
        for job in jobs_by_mongodb_id:
            print(f"  - {job['title']} at {job['company']}")
    
    if not jobs_by_id and not jobs_by_mongodb_id:
        print("❌ NO jobs found for Sarah Johnson!")
        
        # Check what IDs exist in posted_by field
        print("\n🔍 Checking all posted_by IDs in database:")
        unique_posters = await db.jobs.distinct("posted_by")
        print(f"Unique posted_by IDs found: {len(unique_posters)}")
        for poster_id in unique_posters:
            poster = await db.users.find_one({"id": poster_id}) or await db.users.find_one({"_id": poster_id})
            if poster:
                print(f"  - {poster_id} → {poster.get('full_name', 'Unknown')} ({poster.get('email', 'No email')})")
            else:
                print(f"  - {poster_id} → No matching user found")
    
    # 5. Test API authentication simulation
    print(f"\n🔐 API AUTHENTICATION TEST:")
    try:
        # This simulates what the API does
        from utils.auth import create_access_token, decode_access_token
        
        # Create token for Sarah
        token = create_access_token(data={"sub": sarah_id, "role": "recruiter"})
        print(f"✅ Token created successfully")
        
        # Decode token
        payload = decode_access_token(token)
        print(f"✅ Token decoded successfully: {payload}")
        
        # Find user by token payload
        user_from_token = await db.users.find_one({"id": payload.get("sub")})
        if user_from_token:
            print(f"✅ User found by token: {user_from_token['full_name']}")
        else:
            print(f"❌ User NOT found by token sub: {payload.get('sub')}")
            
    except Exception as e:
        print(f"❌ Authentication test failed: {e}")
    
    # 6. Recommendations
    print(f"\n💡 DIAGNOSTIC SUMMARY:")
    if len(sarah_users) == 0:
        print("❌ ISSUE: Sarah Johnson user not found - sample data not injected")
    elif len(all_jobs) == 0:
        print("❌ ISSUE: No jobs found in database - sample data not injected")
    elif len(jobs_by_id) == 0 and len(jobs_by_mongodb_id) == 0:
        print("❌ ISSUE: Jobs exist but not linked to Sarah's ID - ID mismatch problem")
    else:
        print("✅ Data looks correct - might be a frontend/API issue")
    
    client.close()

if __name__ == "__main__":
    print("🚀 Starting database diagnostic...")
    asyncio.run(diagnose_database())
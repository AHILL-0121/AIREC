#!/usr/bin/env python3
"""
Direct endpoint tester - bypasses server routing to test the function
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from routes.applications import get_recent_applications
from routes.auth import get_current_user
from utils.db import get_database

async def test_endpoint_directly():
    """Test the get_recent_applications function directly"""
    
    print("🧪 Testing get_recent_applications endpoint directly...")
    print("=" * 60)
    
    # Create a mock recruiter user (Sarah Johnson from our data)
    mock_user = {
        "id": "f7035a19-a6af-42d6-900e-5d33668caaf1",
        "role": "recruiter",
        "email": "sarah.johnson@techcorp.com",
        "name": "Sarah Johnson"
    }
    
    print(f"👤 Mock User: {mock_user['name']} ({mock_user['role']})")
    print(f"🔑 User ID: {mock_user['id']}")
    print()
    
    try:
        # Test the function directly
        result = await get_recent_applications(current_user=mock_user)
        
        print("✅ Function executed successfully!")
        print(f"📊 Result type: {type(result)}")
        print(f"📄 Keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if isinstance(result, dict) and "data" in result:
            applications = result["data"]
            print(f"📋 Applications found: {len(applications)}")
            
            if applications:
                print("\n📝 Application details:")
                for i, app in enumerate(applications, 1):
                    print(f"   {i}. Application ID: {app.get('id', 'No ID')}")
                    print(f"      Job ID: {app.get('job_id', 'No Job ID')}")
                    print(f"      Candidate: {app.get('candidate', {}).get('name', 'No candidate info')}")
                    print(f"      Job Title: {app.get('job', {}).get('title', 'No job info')}")
                    print(f"      Created: {app.get('created_at', 'No date')}")
                    print()
            else:
                print("   ⚠️  No applications found")
        
        print("\n🎯 FULL RESULT:")
        print("-" * 40)
        import json
        print(json.dumps(result, indent=2, default=str))
        
    except Exception as e:
        print(f"❌ Error occurred: {e}")
        import traceback
        traceback.print_exc()
        
        # Let's also check database connectivity
        print("\n🔍 Checking database...")
        try:
            db = get_database()
            
            # Check jobs by this recruiter
            cursor = db.jobs.find({"posted_by": mock_user["id"]})
            jobs = await cursor.to_list(length=10)
            print(f"📋 Jobs by this recruiter: {len(jobs)}")
            
            for job in jobs:
                print(f"   - {job.get('title', 'No title')} (ID: {job.get('id', 'No ID')})")
            
            # Check all applications
            cursor = db.applications.find({})
            all_apps = await cursor.to_list(length=10)
            print(f"📋 Total applications in DB: {len(all_apps)}")
            
            for app in all_apps:
                print(f"   - Job ID: {app.get('job_id')} | User ID: {app.get('user_id')}")
                
        except Exception as db_error:
            print(f"❌ Database error: {db_error}")

if __name__ == "__main__":
    asyncio.run(test_endpoint_directly())
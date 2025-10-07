"""
API Test Script - Test the exact API calls that the frontend makes
"""

import asyncio
import aiohttp
import json
from utils.auth import create_access_token

async def test_api_calls():
    print("🧪 TESTING API ENDPOINTS")
    print("=" * 50)
    
    # Sarah's user ID from diagnostic
    sarah_id = "f7035a19-a6af-42d6-900e-5d33668caaf1"
    
    # Create token for Sarah (same as frontend would have)
    token = create_access_token(data={"sub": sarah_id, "role": "recruiter"})
    print(f"✅ Created auth token for Sarah")
    
    base_url = "http://localhost:8000/api"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Get user profile (should work)
        print(f"\n🔍 Testing GET /auth/profile")
        try:
            async with session.get(f"{base_url}/auth/profile", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Profile API works: {data.get('data', {}).get('full_name')}")
                else:
                    print(f"❌ Profile API failed: {response.status}")
                    text = await response.text()
                    print(f"Error: {text}")
        except Exception as e:
            print(f"❌ Profile API error: {e}")
        
        # Test 2: Get recruiter's jobs (this is the failing one)
        print(f"\n🔍 Testing GET /jobs/recruiter/my-jobs")
        try:
            async with session.get(f"{base_url}/jobs/recruiter/my-jobs", headers=headers) as response:
                print(f"Response status: {response.status}")
                text = await response.text()
                print(f"Response body: {text}")
                
                if response.status == 200:
                    data = json.loads(text)
                    if data.get('success'):
                        jobs = data.get('data', [])
                        print(f"✅ My-jobs API works: Found {len(jobs)} jobs")
                        for job in jobs:
                            print(f"  - {job.get('title')} at {job.get('company')}")
                    else:
                        print(f"❌ API returned success=false: {data}")
                else:
                    print(f"❌ My-jobs API failed with status {response.status}")
                    
        except Exception as e:
            print(f"❌ My-jobs API error: {e}")
        
        # Test 3: Test analytics dashboard
        print(f"\n🔍 Testing GET /analytics/dashboard")
        try:
            async with session.get(f"{base_url}/analytics/dashboard", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Analytics API works")
                    print(f"Dashboard data: {json.dumps(data, indent=2)}")
                else:
                    print(f"❌ Analytics API failed: {response.status}")
                    text = await response.text()
                    print(f"Error: {text}")
        except Exception as e:
            print(f"❌ Analytics API error: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_calls())
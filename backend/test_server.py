#!/usr/bin/env python3
"""
Minimal test server to isolate the routing issue
"""

from fastapi import FastAPI, APIRouter, Depends, HTTPException
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from routes.auth import get_current_user
from routes.applications import get_recent_applications

# Create minimal app
app = FastAPI(title="Test Server")

# Create router
test_router = APIRouter(prefix="/api")

# Add a simple test route
@test_router.get("/test")
async def test_route():
    return {"message": "Test route working"}

# Add the problematic route
@test_router.get("/applications/recruiter/recent")
async def applications_recent_test(current_user: dict = Depends(get_current_user)):
    """Test version of the recent applications endpoint"""
    return await get_recent_applications(current_user)

# Include router
app.include_router(test_router)

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting minimal test server on port 8002...")
    uvicorn.run(app, host="0.0.0.0", port=8002)
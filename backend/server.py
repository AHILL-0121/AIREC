from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

# Import routes
from routes import auth, resume, jobs, ai_match, analytics

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI(title="AI Job Matching Platform", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check route
@api_router.get("/")
async def root():
    return {
        "message": "AI Job Matching Platform API",
        "version": "1.0.0",
        "status": "running"
    }

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(resume.router, prefix="/resume", tags=["Resume"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(ai_match.router, prefix="/ai-match", tags=["AI Matching"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("AI Job Matching Platform starting up...")
    logger.info(f"Database: {os.environ.get('DB_NAME')}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("AI Job Matching Platform shutting down...")

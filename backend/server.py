from fastapi import FastAPI, APIRouter, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.cors import CORSMiddleware
import os
import time
import json
from pathlib import Path
from contextlib import asynccontextmanager

# Import custom logger and utilities
from utils.logger import get_logger, setup_logger
from utils.env_utils import load_environment_variables, get_api_key

# Configure logger
logger = get_logger(__name__)

# Load environment variables
load_environment_variables()

# Log API key type
gemini_api_key = get_api_key("GEMINI_API_KEY")
if gemini_api_key:
    logger.info("API key loaded successfully")

# Import routes
from routes import auth, resume, jobs, ai_match, analytics, profile, skills, applications

ROOT_DIR = Path(__file__).parent

# Define the lifespan handler for FastAPI
@asynccontextmanager
async def lifespan(app):
    # Startup
    logger.info("AI Job Matching Platform starting up...")
    logger.info(f"Database: {os.environ.get('DB_NAME')}")
    
    # Initialize skill trie
    from services.trie_search import initialize_trie_from_db
    try:
        await initialize_trie_from_db()
        logger.info("Skill trie initialized")
    except Exception as e:
        logger.error(f"Error initializing skill trie: {e}")
    
    yield
    
    # Shutdown
    logger.info("AI Job Matching Platform shutting down...")

# Create the main app with lifespan handler
app = FastAPI(title="AI Job Matching Platform", version="1.0.0", lifespan=lifespan)

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
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(ai_match.router, prefix="/ai-match", tags=["AI Matching"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])


# Include the router in the main app
app.include_router(api_router)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Get client IP and requested path
    client_host = request.client.host if request.client else "Unknown"
    method = request.method
    path = request.url.path
    
    # Log the request
    logger.info(f"Request: {method} {path} - Client: {client_host}")
    
    # Process the request
    try:
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log the response
        logger.info(f"Response: {method} {path} - Status: {response.status_code} - Time: {process_time:.4f}s")
        
        return response
    except Exception as e:
        logger.error(f"Error processing {method} {path}: {str(e)}")
        raise
        
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a check to start the server when run as main script
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting the server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
    logger.info("Server started at http://0.0.0.0:8000")

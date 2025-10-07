# Backend - AI Job Matching Platform

FastAPI backend for the AI-powered recruitment platform with intelligent job-candidate matching.

## Features

- Authentication and user management
- Profile and resume management with AI parsing
- Job creation, search, and recommendations
- AI matching using bipartite graph algorithms
- Candidate ranking with priority queues
- Skills autocomplete using trie data structure
- Analytics and bias detection
- Application management

## Setup and Installation

### Prerequisites

- Python 3.9+
- MongoDB instance
- Gemini API key (optional, for enhanced resume parsing)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=job_matching_db

# Security
SECRET_KEY=your-super-secret-key-replace-in-production

# CORS
CORS_ORIGINS=http://localhost:3000

# API Keys
GEMINI_API_KEY=your-gemini-api-key-here
```

### Installation

```powershell
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # On Windows PowerShell
# source .venv/bin/activate  # On Linux/MacOS

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn server:app --reload --port 8000
```

### API Documentation

Once running, view the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key Endpoints

### Authentication
- POST `/api/auth/signup` - Register a new user
- POST `/api/auth/login` - Authenticate user
- GET `/api/auth/me` - Get current user profile

### Profile & Resume
- GET `/api/profile/{user_id}` - Get user profile
- PUT `/api/profile/{user_id}` - Update user profile
- POST `/api/resume/upload` - Upload and parse resume

### Jobs
- GET `/api/jobs/search` - Search for jobs
- GET `/api/jobs/recommendations` - Get recommended jobs
- POST `/api/jobs` - Create a new job
- GET `/api/jobs/{job_id}` - Get job details

### AI Matching
- POST `/api/ai-match/run` - Run matching algorithm
- GET `/api/ai-match/candidates/{job_id}` - Get candidates for job
- GET `/api/ai-match/score/{job_id}` - Get match score for current user

### Applications
- POST `/api/applications` - Apply for a job
- GET `/api/applications/candidate` - Get user's applications
- GET `/api/applications/recruiter/{job_id}` - Get applications for job
- PUT `/api/applications/{application_id}/status` - Update application status

### Skills
- GET `/api/skills` - Search for skills (autocomplete)

### Analytics
- GET `/api/analytics/bias-report` - Get bias metrics
- GET `/api/analytics/skill-gaps` - Get skill gap analysis
- GET `/api/analytics/dashboard` - Get dashboard stats

## Project Structure

```
backend/
├── routes/            # API route definitions
├── services/          # Business logic services
├── utils/             # Utility functions
├── uploads/           # Uploaded resumes storage
├── server.py          # Main FastAPI application
└── requirements.txt   # Dependencies
```

## Data Structures

The backend implements several specialized data structures:
- **Bipartite Graphs**: Model candidate-job relationships
- **Priority Queues**: Rank candidates efficiently
- **Trie Trees**: Fast skills autocomplete
- **Hash Tables**: Quick skill lookups

## Notes

- Uploaded resumes are stored in `backend/uploads/`
- MongoDB is used for data storage
- AI resume parsing uses Gemini API (falls back to keyword extraction)

# SkillMatch AI - Job Matching Platform

SkillMatch AI is an intelligent job matching platform that uses AI to connect candidates with the most suitable job opportunities. The platform provides tools for resume parsing, skill analysis, and personalized job recommendations.

## Features

### For Candidates

- **Profile Management**: Create and update your professional profile
- **Resume Upload**: Upload and parse your resume to extract skills and experience
- **Skill Analysis**: Identify skill gaps and get learning recommendations
- **Job Matching**: Get personalized job recommendations based on your skills
- **Application Tracking**: Monitor the status of your job applications

### For Recruiters

- **Job Posting**: Create and manage job postings
- **Candidate Matching**: Find candidates with the best skill match for your jobs
- **Application Management**: Review and manage candidate applications
- **Diversity Analysis**: Monitor diversity metrics in your candidate pool

## Tech Stack

### Backend

- **FastAPI**: High-performance API framework for Python
- **MongoDB**: NoSQL database for flexible data storage
- **JWT Authentication**: Secure user authentication and authorization
- **Google Generative AI**: AI-powered resume parsing and skill extraction
- **NetworkX**: Graph algorithms for job-candidate matching
- **PyPDF2**: PDF parsing for resume extraction

### Frontend

- **React**: JavaScript library for building user interfaces
- **React Router**: Declarative routing for React applications
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components
- **Axios**: Promise-based HTTP client for API requests
- **Chart.js**: Interactive charts for analytics (optional)

## Project Structure

```
├── backend/                 # FastAPI backend code
│   ├── server.py            # Main application entry point
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   └── uploads/             # File upload directory
└── frontend/                # React frontend code
    ├── public/              # Static assets
    └── src/                 # React source code
        ├── components/      # Reusable UI components
        ├── contexts/        # React contexts (Auth, etc.)
        ├── hooks/           # Custom React hooks
        ├── pages/           # Application pages
        │   ├── candidate/   # Candidate-specific pages
        │   └── recruiter/   # Recruiter-specific pages
        ├── services/        # API service functions
        └── App.js           # Main application component
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Set your MongoDB connection string
   - Set your Google AI API key
   - Set your JWT secret key

4. Run the server:
   ```
   uvicorn server:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm start
   ```
   
   Or run with enhanced logging:
   ```
   npm run start:log
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application

### Running with Logging

For convenient startup with comprehensive logging, use the provided scripts:

- **Windows**: Run `run_with_logging.ps1` with PowerShell
  ```
  .\run_with_logging.ps1
  ```

- **Linux/Mac**: Run `run_with_logging.sh` bash script
  ```
  ./run_with_logging.sh
  ```

These scripts will start both frontend and backend servers with full logging enabled. For more information about the logging system, see [LOGGING.md](LOGGING.md).

## API Endpoints

### Auth Routes
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update user profile

### Resume Routes
- `POST /api/resume/upload` - Upload and parse a resume using AI
- `GET /api/resume/download/{id}` - Download a resume
- `GET /api/resume/parsed-data` - Get parsed resume data

### Job Routes
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/search` - Search jobs with filters
- `POST /api/jobs` - Create a new job posting (recruiter only)
- `GET /api/jobs/{id}` - Get job details
- `PUT /api/jobs/{id}` - Update job details
- `DELETE /api/jobs/{id}` - Delete job
- `GET /api/jobs/recommendations` - Get job recommendations for candidate
- `GET /api/jobs/recruiter/my-jobs` - Get recruiter's posted jobs

### AI Matching Routes
- `POST /api/ai-match/run` - Run matching algorithm
- `GET /api/ai-match/candidates/{job_id}` - Get ranked candidates for job
- `GET /api/ai-match/score/{job_id}` - Get match score for candidate and job

### Application Routes
- `POST /api/applications/apply/{job_id}` - Apply for a job
- `GET /api/applications/my-applications` - Get candidate's applications
- `GET /api/applications/job/{job_id}` - Get applications for a job (recruiter only)
- `PUT /api/applications/{id}/status` - Update application status (recruiter only)

### Skills Routes
- `GET /api/skills/search/{prefix}` - Search skills with Trie data structure
- `GET /api/skills/trending` - Get trending skills

### Analytics Routes
- `GET /api/analytics/dashboard` - Get role-specific dashboard statistics
- `GET /api/analytics/skill-gaps` - Get candidate skill gaps analysis
- `GET /api/analytics/bias-report` - Get bias analysis report (recruiter only)

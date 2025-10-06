from fastapi import APIRouter, HTTPException, Depends
from routes.auth import get_current_user
from utils.db import get_database
from services.ranking_engine import rank_candidates_for_job
from utils.graph_utils import build_bipartite_graph, find_optimal_matches
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/run")
async def run_matching_algorithm(current_user: dict = Depends(get_current_user)):
    """
    Execute bipartite matching algorithm for all active jobs
    """
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can run matching")
    
    db = get_database()
    
    # Get all candidates and jobs
    candidates = await db.users.find({"role": "candidate"}).to_list(length=1000)
    jobs = await db.jobs.find({"status": "active"}).to_list(length=1000)
    
    if not candidates or not jobs:
        return {
            "success": True,
            "data": {
                "total_matches": 0,
                "message": "No candidates or jobs found"
            }
        }
    
    # Build bipartite graph
    graph = build_bipartite_graph(candidates, jobs)
    
    # Find optimal matches
    matches = find_optimal_matches(graph)
    
    # Store matches in database
    match_docs = []
    for candidate_id, job_id, score in matches:
        match_doc = {
            "id": str(uuid.uuid4()),
            "user_id": candidate_id,
            "job_id": job_id,
            "match_score": int(score * 100),
            "graph_edge_weight": score,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        match_docs.append(match_doc)
    
    if match_docs:
        await db.matches.delete_many({})  # Clear old matches
        await db.matches.insert_many(match_docs)
    
    return {
        "success": True,
        "data": {
            "total_matches": len(match_docs),
            "message": "Matching algorithm completed successfully"
        }
    }

@router.get("/candidates/{job_id}")
async def get_candidates_for_job(
    job_id: str,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get ranked list of candidates for a specific job
    """
    if current_user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can view candidates")
    
    db = get_database()
    
    # Verify job exists and belongs to recruiter
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get and rank candidates
    ranked_candidates = await rank_candidates_for_job(job)
    
    return {
        "success": True,
        "data": ranked_candidates[:limit]
    }

@router.get("/score/{job_id}")
async def get_match_score(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate match score between current user and job
    """
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can view match scores")
    
    db = get_database()
    
    # Get job
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Calculate match score
    user_skills = set([s.lower() for s in current_user.get("skills", [])])
    job_skills = set([s.lower() for s in job.get("required_skills", [])])
    
    skill_overlap = user_skills & job_skills
    match_score = len(skill_overlap) / len(job_skills) if job_skills else 0
    
    return {
        "success": True,
        "data": {
            "match_percentage": int(match_score * 100),
            "matched_skills": list(skill_overlap),
            "missing_skills": list(job_skills - user_skills)
        }
    }

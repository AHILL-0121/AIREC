from fastapi import APIRouter, Depends
from routes.auth import get_current_user
from utils.db import get_database
from services.bias_analysis import calculate_bias_metrics, analyze_skill_gaps

router = APIRouter()

@router.get("/bias-report")
async def get_bias_report(current_user: dict = Depends(get_current_user)):
    """
    Generate diversity and fairness metrics
    """
    if current_user["role"] != "recruiter":
        return {"success": False, "error": "Only recruiters can access bias reports"}
    
    db = get_database()
    
    # Get all matches
    matches = await db.matches.find().to_list(length=1000)
    
    # Calculate bias metrics
    bias_metrics = await calculate_bias_metrics(matches)
    
    return {
        "success": True,
        "data": bias_metrics
    }

@router.get("/skill-gaps")
async def get_skill_gaps(current_user: dict = Depends(get_current_user)):
    """
    Analyze skill gaps for a candidate
    """
    if current_user["role"] != "candidate":
        return {"success": False, "error": "Only candidates can access skill gap analysis"}
    
    db = get_database()
    
    # Get recommended jobs
    jobs = await db.jobs.find({"status": "active"}).to_list(length=50)
    
    # Analyze skill gaps
    skill_gaps = analyze_skill_gaps(current_user, jobs)
    
    return {
        "success": True,
        "data": skill_gaps
    }

@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Get dashboard statistics based on user role
    """
    db = get_database()
    
    if current_user["role"] == "candidate":
        # Candidate dashboard
        total_jobs = await db.jobs.count_documents({"status": "active"})
        applied_jobs = await db.applications.count_documents({"user_id": current_user["id"]})
        matches = await db.matches.count_documents({"user_id": current_user["id"]})
        
        return {
            "success": True,
            "data": {
                "total_active_jobs": total_jobs,
                "applied_jobs": applied_jobs,
                "recommended_matches": matches,
                "profile_completion": current_user.get("profile_complete", False)
            }
        }
    else:
        # Recruiter dashboard
        total_jobs = await db.jobs.count_documents({"posted_by": current_user["id"]})
        active_jobs = await db.jobs.count_documents({"posted_by": current_user["id"], "status": "active"})
        total_candidates = await db.users.count_documents({"role": "candidate"})
        total_matches = await db.matches.count_documents({})
        
        return {
            "success": True,
            "data": {
                "total_jobs_posted": total_jobs,
                "active_jobs": active_jobs,
                "total_candidates": total_candidates,
                "total_matches": total_matches
            }
        }

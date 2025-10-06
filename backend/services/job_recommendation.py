from utils.db import get_database

async def get_recommendations_for_user(user: dict) -> list:
    """
    Generate job recommendations using skill matching
    """
    db = get_database()
    
    user_skills = set([skill.lower() for skill in user.get("skills", [])])
    user_experience = user.get("experience", 0)
    
    # Get all active jobs
    all_jobs = await db.jobs.find({"status": "active"}).to_list(length=100)
    
    # Calculate match scores
    scored_jobs = []
    for job in all_jobs:
        job_skills = set([skill.lower() for skill in job.get("required_skills", [])])
        
        # Calculate skill overlap
        skill_intersection = user_skills & job_skills
        skill_match_score = len(skill_intersection) / len(job_skills) if job_skills else 0
        
        # Calculate experience fit
        min_exp = job.get("min_experience", 0)
        max_exp = job.get("max_experience", 100)
        
        if min_exp <= user_experience <= max_exp:
            exp_score = 1.0
        elif user_experience < min_exp:
            exp_score = max(0, 1 - (min_exp - user_experience) * 0.2)
        else:
            exp_score = max(0, 1 - (user_experience - max_exp) * 0.1)
        
        # Combined score (70% skills, 30% experience)
        total_score = (skill_match_score * 0.7) + (exp_score * 0.3)
        match_percentage = int(total_score * 100)
        
        if match_percentage > 30:  # Only include jobs with >30% match
            job["id"] = str(job["_id"])
            del job["_id"]
            job["posted_by"] = str(job["posted_by"])
            job["match_score"] = match_percentage
            job["matched_skills"] = list(skill_intersection)
            scored_jobs.append(job)
    
    # Sort by match score
    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    
    return scored_jobs[:10]  # Return top 10

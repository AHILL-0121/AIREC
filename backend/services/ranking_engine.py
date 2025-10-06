import heapq
from utils.db import get_database

async def rank_candidates_for_job(job: dict) -> list:
    """
    Rank candidates using priority queue (max heap)
    """
    db = get_database()
    
    # Get all candidates
    candidates = await db.users.find({"role": "candidate"}).to_list(length=1000)
    
    # Create max heap (use negative scores for max heap)
    heap = []
    
    job_skills = set([s.lower() for s in job.get("required_skills", [])])
    
    for candidate in candidates:
        candidate_skills = set([s.lower() for s in candidate.get("skills", [])])
        
        # Calculate match score
        skill_overlap = candidate_skills & job_skills
        skill_score = len(skill_overlap) / len(job_skills) if job_skills else 0
        
        # Experience score
        candidate_exp = candidate.get("experience", 0)
        min_exp = job.get("min_experience", 0)
        max_exp = job.get("max_experience", 100)
        
        if min_exp <= candidate_exp <= max_exp:
            exp_score = 1.0
        else:
            exp_score = max(0, 1 - abs(candidate_exp - min_exp) * 0.15)
        
        # Total score
        total_score = (skill_score * 0.7) + (exp_score * 0.3)
        match_percentage = int(total_score * 100)
        
        if match_percentage > 30:
            # Push to heap (negative score for max heap)
            candidate_copy = candidate.copy()
            candidate_copy["id"] = str(candidate_copy["_id"])
            del candidate_copy["_id"]
            if "password" in candidate_copy:
                del candidate_copy["password"]
            heapq.heappush(heap, (
                -match_percentage,  # Negative for max heap
                candidate_copy["id"],
                {
                    **candidate_copy,
                    "match_score": match_percentage,
                    "matched_skills": list(skill_overlap)
                }
            ))
    
    # Extract ranked candidates
    ranked = []
    while heap:
        score, candidate_id, candidate_data = heapq.heappop(heap)
        ranked.append(candidate_data)
    
    return ranked

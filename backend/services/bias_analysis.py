from collections import Counter

async def calculate_bias_metrics(matches: list) -> dict:
    """
    Calculate fairness and diversity metrics
    """
    if not matches:
        return {
            "total_matches": 0,
            "diversity_score": 0,
            "fairness_metrics": {}
        }
    
    # Calculate distribution statistics
    match_scores = [m["match_score"] for m in matches]
    
    avg_score = sum(match_scores) / len(match_scores)
    min_score = min(match_scores)
    max_score = max(match_scores)
    
    # Calculate score variance (lower is more fair)
    variance = sum((score - avg_score) ** 2 for score in match_scores) / len(match_scores)
    
    return {
        "total_matches": len(matches),
        "average_match_score": round(avg_score, 2),
        "min_match_score": min_score,
        "max_match_score": max_score,
        "score_variance": round(variance, 2),
        "fairness_index": round(100 - (variance * 10), 2)  # Higher is better
    }

def analyze_skill_gaps(user: dict, jobs: list) -> dict:
    """
    Identify most in-demand skills the user is missing
    """
    user_skills = set([s.lower() for s in user.get("skills", [])])
    
    # Count skill frequency across all jobs
    all_job_skills = []
    for job in jobs:
        all_job_skills.extend([s.lower() for s in job.get("required_skills", [])])
    
    skill_frequency = Counter(all_job_skills)
    
    # Find missing skills
    missing_skills = []
    for skill, count in skill_frequency.most_common(20):
        if skill not in user_skills:
            missing_skills.append({
                "skill": skill,
                "demand": count,
                "jobs_requiring": count
            })
    
    return {
        "current_skills": list(user_skills),
        "skill_count": len(user_skills),
        "missing_high_demand_skills": missing_skills[:10],
        "recommendations": [
            f"Learn {skill['skill']} (required by {skill['demand']} jobs)"
            for skill in missing_skills[:5]
        ]
    }

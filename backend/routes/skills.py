from fastapi import APIRouter, Query
from services.trie_search import search_skills, initialize_trie_from_db
from typing import Optional

router = APIRouter()

@router.get("/skills")
async def get_skills(prefix: str = Query("", min_length=1), limit: int = 10):
    """
    Get skills that start with the given prefix
    """
    skills = search_skills(prefix, limit)
    return {
        "success": True,
        "data": skills
    }

@router.post("/skills/refresh")
async def refresh_skills_trie():
    """
    Refresh the skills trie from the database
    """
    await initialize_trie_from_db()
    return {
        "success": True,
        "message": "Skills trie refreshed"
    }
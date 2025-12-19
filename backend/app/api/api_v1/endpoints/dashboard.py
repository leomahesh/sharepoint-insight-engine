from fastapi import APIRouter
from app.services.rag_engine import rag_engine

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats():
    """
    Get statistics for the dashboard from the persistent SQLite DataStore.
    """
    return rag_engine.get_dashboard_stats()

@router.get("/weekly")
async def get_weekly_stats():
    """
    Get weekly upload statistics.
    """
    return rag_engine.get_weekly_stats()

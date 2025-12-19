from fastapi import APIRouter, Request, HTTPException
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/status")
def get_ingestion_status(request: Request):
    """
    Get the status of the background ingestion queue.
    """
    try:
        manager = request.app.state.ingestion_manager
        return manager.get_status()
    except AttributeError:
        # Fallback if manager isn't initialized yet
        return {"error": "Ingestion manager not initialized", "total_files": 0, "processed_files": 0}

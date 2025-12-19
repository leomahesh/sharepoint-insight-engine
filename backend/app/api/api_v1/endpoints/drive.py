from fastapi import APIRouter, HTTPException, Request, Body
from typing import List, Optional
from pydantic import BaseModel
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class IngestRequest(BaseModel):
    file_id: str
    file_name: str

@router.get("/auth/status")
async def get_auth_status(request: Request):
    service = getattr(request.app.state, "google_drive_service", None)
    if not service:
        return {"authenticated": False, "error": "Service not initialized"}
    return {"authenticated": service.is_authenticated()}

@router.post("/auth/login")
async def login(request: Request):
    service = getattr(request.app.state, "google_drive_service", None)
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    try:
        # This blocks until user completes flow in browser
        success = service.authenticate()
        return {"success": success, "authenticated": True}
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files")
async def list_files(request: Request, folder_id: Optional[str] = None):
    service = getattr(request.app.state, "google_drive_service", None)
    if not service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    
    if not service.is_authenticated():
         raise HTTPException(status_code=401, detail="Not authenticated. Please login first.")

    try:
        files = service.list_files(folder_id)
        return files
    except Exception as e:
        logger.error(f"List files failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest")
async def ingest_file(request: Request, payload: IngestRequest):
    service = getattr(request.app.state, "google_drive_service", None)
    ingestion_manager = getattr(request.app.state, "ingestion_manager", None)
    
    if not service or not ingestion_manager:
        raise HTTPException(status_code=500, detail="Services not initialized")

    try:
        # Define destination: backend/data_archive/google_drive
        # endpoints/drive.py is at backend/app/api/api_v1/endpoints/drive.py
        # We want backend/data_archive
        base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        dest_dir = os.path.join(base_path, "data_archive", "google_drive")
        
        file_path = service.download_file(payload.file_id, payload.file_name, dest_dir)
        
        # Add to ingestion queue
        ingestion_manager.add_to_queue(file_path)
        
        return {"status": "ingesting", "file": payload.file_name}
    except Exception as e:
        logger.error(f"Ingest failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.core.config import settings
from app.services.rag_engine import RAGEngine
import shutil
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/url")
async def update_sharepoint_url(url: str):
    """
    Updates the SharePoint URL used for scraping.
    In a real app, this would persist to a database or .env file.
    For now, it updates the runtime setting.
    """
    # Validate URL roughly
    if "sharepoint.com" not in url and "onedrive" not in url:
        raise HTTPException(status_code=400, detail="Invalid SharePoint/OneDrive URL")
    
    settings.SHAREPOINT_SITE_URL = url
    return {"message": "URL updated successfully", "url": url}

@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Handles bulk file uploads (PDF, Excel, CSV, Word).
    Saves them to a 'uploads' directory and ingests them into RAG.
    """
    from app.services.rag_engine import rag_engine
    
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    ingested_count = 0
    errors = []

    for file in files:
        try:
            file_location = f"{upload_dir}/{file.filename}"
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Use Production Engine to Ingest
            # Uses pypdf/pandas to extract text, Gemini to embed, and saves to SQLite/Chroma
            doc = rag_engine.ingest_file(
                file_path=file_location, 
                original_filename=file.filename,
                source="upload",
                category="General" # Default category for now
            )
            
            if doc:
                ingested_count += 1
            else:
                errors.append(f"{file.filename}: Ingestion returned None (empty text?)")
            
        except Exception as e:
            logger.error(f"Failed to upload {file.filename}: {e}")
            errors.append(f"{file.filename}: {str(e)}")

    return {
        "message": f"Successfully processed {ingested_count} files.",
        "errors": errors
    }

# Flasher Config
from app.services.flasher_service import get_flasher_config, update_flasher_config, FlasherUpdate

@router.get("/flasher")
async def get_flasher():
    """
    Get the current flasher message.
    """
    return get_flasher_config()

@router.post("/flasher")
async def set_flasher(config: FlasherUpdate):
    """
    Update the flasher message.
    """
    return update_flasher_config(config)

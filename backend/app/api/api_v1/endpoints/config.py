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
    rag = RAGEngine()
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    ingested_count = 0
    errors = []

    for file in files:
        try:
            file_location = f"{upload_dir}/{file.filename}"
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # TODO: Add specific loaders for Excel/CSV here.
            # For now, we treat them as generic text or use standard loaders if compatible.
            # RAG Engine 'ingest_documents' expects a list of dicts.
            
            # Mocking ingestion for the demo:
            doc_data = {
                "title": file.filename,
                "url": f"file://{os.path.abspath(file_location)}",
                "content": f"Content of uploaded file {file.filename}", # In real impl, use PyPDF/Pandas here
                "type": file.filename.split('.')[-1]
            }
            
            rag.ingest_documents([doc_data])
            ingested_count += 1
            
        except Exception as e:
            logger.error(f"Failed to upload {file.filename}: {e}")
            errors.append(f"{file.filename}: {str(e)}")

    return {
        "message": f"Successfully processed {ingested_count} files.",
        "errors": errors
    }

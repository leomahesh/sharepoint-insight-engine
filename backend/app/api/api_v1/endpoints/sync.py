from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.sharepoint_scraper import SharePointScraper
from app.services.rag_engine import RAGEngine
from app.core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Basic in-memory status store (use a database in production)
sync_status = {"status": "idle", "message": "", "docs_count": 0}

async def run_sync_task():
    global sync_status
    sync_status["status"] = "running"
    sync_status["message"] = "Starting sync..."
    
    scraper = SharePointScraper(settings.SHAREPOINT_SITE_URL)
    rag = RAGEngine()
    
    try:
        sync_status["message"] = "Waiting for user login in browser..."
        await scraper.login_and_wait()
        
        sync_status["message"] = "Scraping documents..."
        documents = await scraper.scrape_documents()
        
        sync_status["message"] = f"Ingesting {len(documents)} documents into Vector DB..."
        # In a real app, we would download the content of each document here.
        # For now, we mock the content based on the title/metadata for RAG demonstration.
        from app.services.data_store import data_store
        
        for doc in documents:
            doc["content"] = f"Content for {doc['title']}. This is a simulated text extract from the Sharepoint file located at {doc['url']}."
            # Extract type from title or url
            dtype = "unknown"
            if "." in doc['title']: dtype = doc['title'].split('.')[-1]
            data_store.add_document(name=doc['title'], doc_type=dtype, source="sharepoint")
            
        count = rag.ingest_documents(documents)
        
        sync_status["status"] = "complete"
        sync_status["message"] = "Sync complete."
        sync_status["docs_count"] = count
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Sync failed: {e}\n{error_details}")
        
        # Write to error.log for debugging
        with open("error.log", "w") as f:
            f.write(f"Error: {str(e)}\n\nTraceback:\n{error_details}")
            
        sync_status["status"] = "error"
        sync_status["message"] = f"Error: {type(e).__name__} - {str(e)}"
    finally:
        await scraper.close()

@router.post("/start")
async def start_sync(background_tasks: BackgroundTasks):
    if sync_status["status"] == "running":
        raise HTTPException(status_code=400, detail="Sync already in progress")
    
    background_tasks.add_task(run_sync_task)
    return {"message": "Sync started"}

@router.get("/status")
async def get_sync_status():
    return sync_status

import sys
import asyncio

# CRITICAL FIX for Playwright on Windows: 
# Must set ProactorEventLoopPolicy before ANY other async code or imports that might init a loop.
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router

from contextlib import asynccontextmanager
from app.services.rag_engine import RAGEngine
from app.services.ingestion_manager import IngestionManager
from app.services.watcher import RecursiveFileWatcher
import os

# Global state holders
rag_engine = None
ingestion_manager = None
watcher = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global ingestion_manager, watcher
    
    # 1. Use Global RAG Engine (Already init on import)
    # rag_engine is imported from app.services.rag_engine
    
    # 2. Init Ingestion Manager
    ingestion_manager = IngestionManager(rag_engine)
    app.state.ingestion_manager = ingestion_manager # Expose to API
    
    # 3. Init & Start Watcher
    # Use absolute path for data archive or relative to backend
    watch_dir = os.path.join(os.path.dirname(__file__), "..", "data_archive")
    watcher = RecursiveFileWatcher(watch_dir, ingestion_manager)
    watcher.start()
    
    # 4. Init Google Drive Service
    try:
        from app.services.google_drive_service import GoogleDriveService
        drive_base_dir = os.path.join(os.path.dirname(__file__), "..") # backend/
        google_drive_service = GoogleDriveService(drive_base_dir)
        app.state.google_drive_service = google_drive_service
    except Exception as e:
        print(f"Failed to init Google Drive Service: {e}")

    yield
    
    # Shutdown
    if watcher:
        watcher.stop()

app = FastAPI(title="SharePoint Insight Engine API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to SharePoint Insight Engine API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

import asyncio
import logging
import os
from collections import deque
from app.services.rag_engine import RAGEngine

logger = logging.getLogger(__name__)

class IngestionManager:
    def __init__(self, rag_engine: RAGEngine):
        self.rag_engine = rag_engine
        self.queue = deque()
        self.processing = False
        self.status = {
            "total_files": 0,
            "processed_files": 0,
            "current_file": None,
            "failed_files": 0,
            "is_processing": False
        }

    def add_to_queue(self, file_path: str):
        if file_path not in self.queue:
            self.queue.append(file_path)
            self.status["total_files"] += 1
            logger.info(f"Added to queue: {file_path}. Queue size: {len(self.queue)}")
            if not self.processing:
                asyncio.create_task(self.process_queue())

    async def process_queue(self):
        if self.processing:
            return
        
        self.processing = True
        self.status["is_processing"] = True

        while self.queue:
            file_path = self.queue.popleft()
            self.status["current_file"] = os.path.basename(file_path)
            
            try:
                # Retrieve existing sync logic from rag_engine or call it directly
                # For now running sync in executor to avoid blocking main thread
                # In a real heavy app, this should be a separate worker process/celery
                logger.info(f"Processing: {file_path}")
                await asyncio.to_thread(self._ingest_sync, file_path)
                self.status["processed_files"] += 1
            except Exception as e:
                logger.error(f"Failed to process {file_path}: {e}")
                self.status["failed_files"] += 1
            
        self.status["current_file"] = None
        self.status["is_processing"] = False
        self.processing = False
        logger.info("Ingestion queue empty.")

    def _ingest_sync(self, file_path: str):
        # We need to determine filename, source, etc.
        filename = os.path.basename(file_path)
        # Using "Watched Folder" as source
        try:
             # Wait a tiny bit for file write to complete if it was a copy event
            import time
            time.sleep(1) 
            self.rag_engine.ingest_file(file_path, filename, source="watched_folder", category="Auto-Ingest")
        except Exception as e:
            logger.error(f"Error acting on RAGEngine: {e}")
            raise e

    def get_status(self):
        return self.status

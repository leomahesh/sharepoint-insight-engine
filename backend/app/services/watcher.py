import time
import os
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from app.services.ingestion_manager import IngestionManager

logger = logging.getLogger(__name__)

class RecursiveFileWatcher:
    def __init__(self, watch_dir: str, ingestion_manager: IngestionManager):
        self.watch_dir = watch_dir
        self.ingestion_manager = ingestion_manager
        self.observer = Observer()
        self.event_handler = IngestionHandler(self.ingestion_manager)

    def start(self):
        if not os.path.exists(self.watch_dir):
            os.makedirs(self.watch_dir, exist_ok=True)
            logger.info(f"Created watch directory: {self.watch_dir}")

        self.observer.schedule(self.event_handler, self.watch_dir, recursive=True)
        self.observer.start()
        logger.info(f"Started watching directory: {self.watch_dir}")

    def stop(self):
        self.observer.stop()
        self.observer.join()
        logger.info("Stopped file watcher.")

class IngestionHandler(FileSystemEventHandler):
    def __init__(self, ingestion_manager: IngestionManager):
        self.ingestion_manager = ingestion_manager

    def on_created(self, event):
        if event.is_directory:
            return
        logger.info(f"New file detected: {event.src_path}")
        self.ingestion_manager.add_to_queue(event.src_path)

    def on_modified(self, event):
        if event.is_directory:
            return
        logger.info(f"File modified: {event.src_path}")
        self.ingestion_manager.add_to_queue(event.src_path)

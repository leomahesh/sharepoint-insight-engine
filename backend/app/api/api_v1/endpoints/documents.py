from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Document as DBDocument
from app.services.rag_engine import RAGEngine

router = APIRouter()

@router.get("/{doc_id}")
async def get_document_details(doc_id: str, db: Session = Depends(get_db)):
    """
    Get detailed information for a specific document, including an AI-generated report.
    """
    rag = RAGEngine()
    
    # Try to fetch from DB
    try:
        if doc_id.isdigit():
             db_doc = db.query(DBDocument).filter(DBDocument.id == int(doc_id)).first()
        else:
             # If using UUIDs or other string IDs, adjust queries accordingly.
             # Assuming int ID for now based on models.py (usually) but let's check.
             # If models.py defines ID as Integer, we need int.
             try:
                 db_doc = db.query(DBDocument).filter(DBDocument.id == int(doc_id)).first()
             except ValueError:
                 raise HTTPException(status_code=400, detail="Invalid Document ID format")
        
        if not db_doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Mock content if file reading not implemented or file missing
        # In a real scenario, read file_path
        content_preview = db_doc.summary or "Content not available."
        
        # If we have a file path, we could try to read it, but for now summary is good enough for 'content' usage in Studio
        # or we return the summary as the content for the Studio to work on if raw text isn't stored in DB.
        # Ideally, we should store text_content in DB or read from disk.
        # Let's try to read from disk if it exists.
        import os
        full_content = content_preview
        if db_doc.file_path and os.path.exists(db_doc.file_path):
            try:
                with open(db_doc.file_path, 'r', errors='ignore') as f:
                    full_content = f.read(5000) # Read first 5000 chars
            except:
                pass

        return {
            "id": str(db_doc.id),
            "name": db_doc.filename,
            "content_preview": full_content,
            "ai_report": db_doc.summary,
            "metadata": {
                "category": db_doc.category,
                "created": db_doc.upload_date.strftime("%Y-%m-%d"),
                "modified": db_doc.upload_date.strftime("%Y-%m-%d"), # Using upload date for now
                "size": "Unknown", # Not stored in DB model yet
                "path": db_doc.file_path
            },
            "comments": [] # Comments not in DB model yet
        }

    except Exception as e:
        # Fallback to Mock if DB fails or empty
        print(f"DB Error: {e}")
        # Return mock if DB lookup fails (e.g. during dev/testing without real data)
        # But for 'Production' feel we should error out or return empty.
        # Let's return the mock for stability if ID is 'mock' or similar test.
        raise HTTPException(status_code=404, detail=f"Document not found: {e}")

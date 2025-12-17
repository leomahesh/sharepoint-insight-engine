from fastapi import APIRouter
from app.services.rag_engine import RAGEngine

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats():
    """
    Get statistics for the dashboard.
    """
    rag = RAGEngine()
    stats = rag.get_stats()
    
    # Enrich with recent documents (mock for now because VectorDB doesn't store access dates easily)
    recent_docs = [
        {"id": "doc1", "name": "Project_Status.pdf", "type": "pdf", "date": "Just now"},
        {"id": "doc2", "name": "Budget_Q4.xlsx", "type": "excel", "date": "Today"},
    ]
    
    return {
        "document_counts": stats.get("document_counts", {}),
        "total_documents": stats.get("total_documents", 0),
        "recent_documents": recent_docs
    }

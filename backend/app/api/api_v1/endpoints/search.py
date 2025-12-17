from fastapi import APIRouter
from app.services.rag_engine import rag_engine

router = APIRouter()

@router.get("/")
async def search_documents(q: str):
    """
    Search documents using Semantic Search (ChromaDB).
    """
    return rag_engine.search(q)

from fastapi import APIRouter
from app.services.rag_engine import rag_engine

router = APIRouter()

@router.get("/")
async def search_documents(q: str):
    """
    Search documents using Semantic Search (ChromaDB) and generate an answer.
    """
    results = rag_engine.search(q)
    
    # Simple "NotebookLM" style: Generate answer based on top results
    answer = rag_engine.query_with_rag(q)
    
    return {
        "results": results,
        "answer": answer
    }

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_docs(req: ChatRequest):
    """
    Chat with the RAG engine.
    """
    answer = rag_engine.query_with_rag(req.message)
    # Also return sources if possible (rag_engine would need update, but for now just answer)
    # To improve, we search first to get sources
    results = rag_engine.search(req.message)
    
    return {
        "answer": answer,
        "sources": results
    }

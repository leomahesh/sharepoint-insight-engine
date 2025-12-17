from fastapi import APIRouter
from app.services.rag_engine import RAGEngine

router = APIRouter()

@router.get("/{doc_id}")
async def get_document_details(doc_id: str):
    """
    Get detailed information for a specific document, including an AI-generated report.
    """
    rag = RAGEngine()
    
    # In a real app, retrieve content from DB/SharePoint. 
    # Here we mock it to demonstrate the AI capability.
    mock_content = """
    Project Alpha Q3 Status Report.
    The project is currently on track. 
    Key Milestones achieved: 
    1. UI Design completed on Oct 15th.
    2. Backend API V1 released on Oct 20th.
    
    Risks:
    - User Acceptance Testing (UAT) is delayed by 3 days due to stakeholder unavailability.
    - Budget utilization is at 85%, slightly higher than projected.
    
    Next Steps:
    - Begin Phase 2 planning by Nov 1st.
    - Resolve UAT blockers.
    """
    
    ai_summary = rag.summarize(mock_content)

    return {
        "id": doc_id,
        "name": "Project_Alpha_Q3_Report.pdf",
        "content_preview": mock_content,
        "ai_report": ai_summary,
        "metadata": {
            "author": "Alice Smith",
            "created": "2023-01-15",
            "modified": "2023-10-20",
            "size": "2.5 MB",
            "path": "/sites/Team/Shared Documents/Project_Alpha_Q3_Report.pdf"
        },
        "comments": [
            {"user": "Manager", "text": "Looks good, approved.", "date": "2023-10-21"}
        ]
    }

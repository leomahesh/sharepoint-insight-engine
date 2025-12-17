from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter()

@router.get("/")
async def search_documents(q: str = Query(..., min_length=1)):
    """
    Search documents by keyword.
    Currently returns mock data.
    """
    # Mock search logic
    results = [
        {
            "id": "101",
            "title": f"Result for {q} - Meeting Notes",
            "snippet": f"Discussion regarding {q} and future plans...",
            "source": "SharePoint/Team/General",
            "author": "Alice Smith",
            "modified": "2023-10-20"
        },
        {
            "id": "102",
            "title": f"Specification - {q}",
            "snippet": f"Technical details about the implementation of {q}...",
            "source": "SharePoint/Engineering/Specs",
            "author": "Bob Jones",
            "modified": "2023-09-15"
        }
    ]
    return {"results": results}

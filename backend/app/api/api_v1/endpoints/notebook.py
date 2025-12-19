from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.rag_engine import rag_engine

router = APIRouter()

class DeepReportRequest(BaseModel):
    topic: str
    source_ids: Optional[List[str]] = []

class DeepReportResponse(BaseModel):
    report_markdown: str

@router.post("/deep_report", response_model=DeepReportResponse)
def create_deep_report(request: DeepReportRequest):
    """
    Generate a deep analysis report based on a topic and optional source IDs.
    """
    report_content = rag_engine.generate_deep_report(
        topic=request.topic,
        source_ids=request.source_ids
    )
    return DeepReportResponse(report_markdown=report_content)

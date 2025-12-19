from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.rag_engine import rag_engine

router = APIRouter()

class StudioRequest(BaseModel):
    content: str

class PodcastResponse(BaseModel):
    script: str

class MindMapResponse(BaseModel):
    mermaid_syntax: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

@router.post("/podcast", response_model=PodcastResponse)
async def generate_podcast(request: StudioRequest):
    """
    Generate a podcast script from the provided content.
    """
    script = rag_engine.generate_podcast_script(request.content)
    return {"script": script}

@router.post("/mindmap", response_model=MindMapResponse)
async def generate_mind_map(request: StudioRequest):
    """
    Generate a Mermaid.js mind map from the provided content.
    """
    syntax = rag_engine.generate_mind_map(request.content)
    return {"mermaid_syntax": syntax}

@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(request: StudioRequest):
    """
    Generate quiz questions from the provided content.
    """
    questions = rag_engine.generate_quiz(request.content)
    return {"questions": questions}

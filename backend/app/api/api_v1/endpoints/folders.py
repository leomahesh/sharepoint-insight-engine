from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import Folder

router = APIRouter()

class FolderCreate(BaseModel):
    name: str
    category: str

class FolderResponse(BaseModel):
    id: int
    name: str
    category: str

    class Config:
        from_attributes = True

@router.get("/{category}", response_model=List[FolderResponse])
def get_folders(category: str, db: Session = Depends(get_db)):
    """
    Get all folders for a specific category (e.g., ABET, CAA).
    """
    folders = db.query(Folder).filter(Folder.category == category).all()
    # Seed default folders if empty for a smoother experience
    if not folders:
        defaults = ['Standards & Criteria', 'Self-Study Report (SSR)', 'Faculty Credentials', 'Course Syllabi', 'Student Work Samples', 'Assessment Results', 'Meeting Minutes', 'Correspondence']
        new_folders = []
        for name in defaults:
             f = Folder(name=name, category=category)
             db.add(f)
             new_folders.append(f)
        db.commit()
        for f in new_folders:
            db.refresh(f)
        return new_folders

    return folders

@router.post("/", response_model=FolderResponse)
def create_folder(folder: FolderCreate, db: Session = Depends(get_db)):
    """
    Create a new folder.
    """
    new_folder = Folder(name=folder.name, category=folder.category)
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder

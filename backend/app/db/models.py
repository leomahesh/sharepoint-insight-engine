from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    file_type = Column(String)  # pdf, docx, etc.
    source = Column(String) # upload, sharepoint
    category = Column(String, default="General") # Analytics, Accreditation, OBEF
    upload_date = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text, nullable=True) # AI generated summary
    vector_id = Column(String, nullable=True) # ID in ChromaDB

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True) # ABET, CAA, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

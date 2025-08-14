from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from .database import Base

class PDFDocument(Base):
    __tablename__ = "pdf_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)  # Store the original filename from upload
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    file_hash = Column(String(64), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    # Optional metadata
    title = Column(String(500), nullable=True)  # Extracted or user-provided title
    pages = Column(Integer, nullable=True)  # Number of pages
    content_preview = Column(Text, nullable=True)  # First few lines of extracted text

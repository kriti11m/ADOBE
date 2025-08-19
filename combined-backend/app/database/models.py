from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
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

    # Relationship to document snippets
    snippets = relationship("DocumentSnippet", back_populates="document", cascade="all, delete-orphan")

class DocumentSnippet(Base):
    """Store text snippets/chunks from documents for search and analysis"""
    __tablename__ = "document_snippets"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("pdf_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=True)  # Which page this snippet is from
    content = Column(Text, nullable=False)  # The actual text content
    chunk_index = Column(Integer, nullable=True)  # Order of this chunk in the document
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship back to document
    document = relationship("PDFDocument", back_populates="snippets")

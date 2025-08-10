from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# Association table for many-to-many relationship
session_documents = Table(
    'session_documents',
    Base.metadata,
    Column('session_id', Integer, ForeignKey('analysis_sessions.id'), primary_key=True),
    Column('document_id', Integer, ForeignKey('pdf_documents.id'), primary_key=True)
)

class PDFDocument(Base):
    __tablename__ = "pdf_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    file_hash = Column(String(64), unique=True, index=True)
    
    # Relationships
    analyses = relationship("AnalysisSession", secondary=session_documents, back_populates="documents")

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"
 
    id = Column(Integer, primary_key=True, index=True)
    session_timestamp = Column(DateTime, default=datetime.utcnow)
    persona = Column(String(100), nullable=False)
    job_description = Column(Text, nullable=False)
    processing_time_seconds = Column(Float, nullable=True)
    
    # Relationships
    documents = relationship("PDFDocument", secondary=session_documents, back_populates="analyses")
    extracted_sections = relationship("ExtractedSection", back_populates="session")
    insights = relationship("GeneratedInsight", back_populates="session")

class ExtractedSection(Base):
    __tablename__ = "extracted_sections"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("analysis_sessions.id"))
    document_name = Column(String(255), nullable=False)
    page_number = Column(Integer, nullable=False)
    section_title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    importance_rank = Column(Integer, nullable=True)
    relevance_score = Column(Float, nullable=True)
# Relationship
    session = relationship("AnalysisSession", back_populates="extracted_sections")

class GeneratedInsight(Base):
    __tablename__ = "generated_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("analysis_sessions.id"))
    insight_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    insight_metadata = Column(JSON, nullable=True)  # Changed from 'metadata' to 'insight_metadata'
    
    # Relationship
    session = relationship("AnalysisSession", back_populates="insights")

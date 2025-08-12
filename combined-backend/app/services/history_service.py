from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
from ..database.models import PDFDocument, AnalysisSession, ExtractedSection, GeneratedInsight, UserProfile

class HistoryService:
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_file_hash(self, file_content: bytes) -> str:
        """Calculate SHA-256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()
    
    def store_pdf_document(self, filename: str, file_content: bytes, file_path: str = None) -> PDFDocument:
        """Store PDF document information"""
        file_hash = self.calculate_file_hash(file_content)
        
        # Check if document already exists
        existing_doc = self.db.query(PDFDocument).filter(PDFDocument.file_hash == file_hash).first()
        if existing_doc:
            return existing_doc
        
        # Create new document record
        pdf_doc = PDFDocument(
            filename=filename,
            file_path=file_path,
            file_size=len(file_content),
            file_hash=file_hash
        )
        
        self.db.add(pdf_doc)
        self.db.commit()
        self.db.refresh(pdf_doc)
        return pdf_doc
    
    def create_analysis_session(self, persona: str, job_description: str, 
                              pdf_documents: List[PDFDocument], 
                              processing_time: float = None, 
                              profile_id: int = None) -> Optional[AnalysisSession]:
        """Create a new analysis session"""
        # Require profile_id - no default profile logic
        if profile_id is None:
            return None  # Cannot create session without profile
        
        session = AnalysisSession(
            profile_id=profile_id,
            persona=persona,
            job_description=job_description,
            processing_time_seconds=processing_time,
            documents=pdf_documents
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session
    
    def store_extracted_sections(self, session_id: int, sections: List[Dict[str, Any]]):
        """Store extracted sections from analysis"""
        for section in sections:
            extracted_section = ExtractedSection(
                session_id=session_id,
                document_name=section.get('document', ''),
                page_number=section.get('page_number', 0),
                section_title=section.get('section_title', ''),
                content=section.get('content', ''),
                importance_rank=section.get('importance_rank'),
                relevance_score=section.get('relevance_score')
            )
            self.db.add(extracted_section)
        
        self.db.commit()
    
    def store_generated_insights(self, session_id: int, insights: Dict[str, Any]):
        """Store AI-generated insights"""
        # Store key insights
        if 'key_insights' in insights:
            for insight in insights['key_insights']:
                generated_insight = GeneratedInsight(
                    session_id=session_id,
                    insight_type='key',
                    content=str(insight)
                )
                self.db.add(generated_insight)
        
        # Store other insight types
        for insight_type in ['did_you_know', 'contradictions', 'podcast_script']:
            if insight_type in insights:
                generated_insight = GeneratedInsight(
                    session_id=session_id,
                    insight_type=insight_type,
                    content=str(insights[insight_type])
                )
                self.db.add(generated_insight)
        
        self.db.commit()
    
    def get_analysis_history(self, limit: int = 50, offset: int = 0, profile_id: int = None) -> List[Dict[str, Any]]:
        """Get analysis history with pagination, optionally filtered by profile"""
        query = self.db.query(AnalysisSession)
        
        if profile_id is not None:
            query = query.filter(AnalysisSession.profile_id == profile_id)
        
        sessions = (
            query.order_by(desc(AnalysisSession.session_timestamp))
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        history = []
        for session in sessions:
            # Get sections count
            sections_count = (
                self.db.query(ExtractedSection)
                .filter(ExtractedSection.session_id == session.id)
                .count()
            )
            
            # Get insights count
            insights_count = (
                self.db.query(GeneratedInsight)
                .filter(GeneratedInsight.session_id == session.id)
                .count()
            )
            
            # Get profile information
            profile_info = {}
            if session.profile:
                profile_info = {
                    "profile_id": session.profile.id,
                    "profile_name": session.profile.profile_name
                }
            
            history.append({
                'session_id': session.id,
                'timestamp': session.session_timestamp.isoformat(),
                'persona': session.persona,
                'job_description': session.job_description,
                'processing_time': session.processing_time_seconds,
                'profile': profile_info,
                'documents': [
                    {
                        'filename': doc.filename,
                        'file_size': doc.file_size,
                        'upload_date': doc.upload_timestamp.isoformat()
                    }
                    for doc in session.documents
                ],
                'sections_extracted': sections_count,
                'insights_generated': insights_count
            })
        
        return history
    
    def get_profile_analysis_history(self, profile_id: int, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get analysis history for a specific profile"""
        return self.get_analysis_history(limit=limit, offset=offset, profile_id=profile_id)
    
    def get_session_details(self, session_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific session"""
        session = self.db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
        if not session:
            return None
        
        sections = (
            self.db.query(ExtractedSection)
            .filter(ExtractedSection.session_id == session_id)
            .order_by(ExtractedSection.importance_rank)
            .all()
        )
        
        insights = (
            self.db.query(GeneratedInsight)
            .filter(GeneratedInsight.session_id == session_id)
            .all()
        )
        
        return {
            'session': {
                'id': session.id,
                'timestamp': session.session_timestamp.isoformat(),
                'persona': session.persona,
                'job_description': session.job_description,
                'processing_time': session.processing_time_seconds,
                'profile': {
                    'id': session.profile.id,
                    'profile_name': session.profile.profile_name
                } if session.profile else None
            },
            'documents': [
                {
                    'id': doc.id,
                    'filename': doc.filename,
                    'file_size': doc.file_size,
                    'upload_date': doc.upload_timestamp.isoformat(),
                    'file_hash': doc.file_hash
                }
                for doc in session.documents
            ],
            'extracted_sections': [
                {
                    'document_name': section.document_name,
                    'page_number': section.page_number,
                    'section_title': section.section_title,
                    'content': section.content,
                    'importance_rank': section.importance_rank,
                    'relevance_score': section.relevance_score
                }
                for section in sections
            ],
            'insights': [
                {
                    'type': insight.insight_type,
                    'title': insight.title,
                    'content': insight.content,
                    'metadata': insight.insight_metadata
                }
                for insight in insights
            ]
        }

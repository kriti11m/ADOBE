"""
PDF Document Service
Handles CRUD operations for PDF documents
"""
import hashlib
import os
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.models import PDFDocument
from app.database.database import SessionLocal

class PDFDocumentService:
    
    @staticmethod
    def get_db_session():
        """Get database session"""
        return SessionLocal()
    
    @staticmethod
    def calculate_file_hash(file_path: str) -> str:
        """Calculate SHA-256 hash of a file"""
        hash_sha256 = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
        except Exception:
            # If file doesn't exist or can't be read, generate hash from filename
            hash_sha256.update(file_path.encode())
        return hash_sha256.hexdigest()
    
    @staticmethod
    def create_document(
        filename: str,
        original_filename: str,
        file_path: str = None,
        file_size: int = None,
        title: str = None,
        pages: int = None,
        content_preview: str = None
    ) -> PDFDocument:
        """Create a new PDF document record"""
        db = PDFDocumentService.get_db_session()
        try:
            # Calculate file hash
            file_hash = PDFDocumentService.calculate_file_hash(file_path) if file_path else None
            
            # Check if document with same hash already exists
            if file_hash:
                existing = db.query(PDFDocument).filter(PDFDocument.file_hash == file_hash).first()
                if existing:
                    return existing
            
            # Create new document
            document = PDFDocument(
                filename=filename,
                original_filename=original_filename,
                file_path=file_path,
                file_size=file_size,
                file_hash=file_hash,
                title=title,
                pages=pages,
                content_preview=content_preview
            )
            
            db.add(document)
            db.commit()
            db.refresh(document)
            return document
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    @staticmethod
    def get_all_documents(active_only: bool = True) -> List[PDFDocument]:
        """Get all PDF documents"""
        db = PDFDocumentService.get_db_session()
        try:
            query = db.query(PDFDocument)
            if active_only:
                query = query.filter(PDFDocument.is_active == True)
            return query.order_by(desc(PDFDocument.upload_timestamp)).all()
        finally:
            db.close()
    
    @staticmethod
    def get_document_by_id(document_id: int) -> Optional[PDFDocument]:
        """Get a document by ID"""
        db = PDFDocumentService.get_db_session()
        try:
            return db.query(PDFDocument).filter(PDFDocument.id == document_id).first()
        finally:
            db.close()
    
    @staticmethod
    def get_document_by_hash(file_hash: str) -> Optional[PDFDocument]:
        """Get a document by file hash"""
        db = PDFDocumentService.get_db_session()
        try:
            return db.query(PDFDocument).filter(PDFDocument.file_hash == file_hash).first()
        finally:
            db.close()
    
    @staticmethod
    def update_document(document_id: int, **updates) -> Optional[PDFDocument]:
        """Update a document"""
        db = PDFDocumentService.get_db_session()
        try:
            document = db.query(PDFDocument).filter(PDFDocument.id == document_id).first()
            if not document:
                return None
            
            for key, value in updates.items():
                if hasattr(document, key):
                    setattr(document, key, value)
            
            db.commit()
            db.refresh(document)
            return document
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    @staticmethod
    def delete_document(document_id: int, soft_delete: bool = True) -> bool:
        """Delete a document (soft delete by default)"""
        db = PDFDocumentService.get_db_session()
        try:
            document = db.query(PDFDocument).filter(PDFDocument.id == document_id).first()
            if not document:
                return False
            
            if soft_delete:
                document.is_active = False
                db.commit()
            else:
                db.delete(document)
                db.commit()
            
            return True
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    @staticmethod
    def search_documents(query: str, active_only: bool = True) -> List[PDFDocument]:
        """Search documents by filename or title"""
        db = PDFDocumentService.get_db_session()
        try:
            search_query = db.query(PDFDocument)
            
            if active_only:
                search_query = search_query.filter(PDFDocument.is_active == True)
            
            search_query = search_query.filter(
                (PDFDocument.filename.ilike(f"%{query}%")) |
                (PDFDocument.original_filename.ilike(f"%{query}%")) |
                (PDFDocument.title.ilike(f"%{query}%"))
            )
            
            return search_query.order_by(desc(PDFDocument.upload_timestamp)).all()
        finally:
            db.close()

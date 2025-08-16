import os
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..database.models import PDFDocument

router = APIRouter(prefix="/collections", tags=["Document Management"])

@router.get("/documents")
async def list_all_documents(db: Session = Depends(get_db)):
    """
    List all uploaded PDF documents with their status.
    
    Returns:
        Dict with list of documents and their information
    """
    try:
        documents = db.query(PDFDocument).all()
        
        document_list = []
        for doc in documents:
            file_exists = doc.file_path and os.path.exists(doc.file_path)
            document_info = {
                "id": doc.id,
                "filename": doc.original_filename,
                "file_path": doc.file_path,
                "upload_date": doc.upload_timestamp.isoformat() if doc.upload_timestamp else None,
                "file_exists": file_exists,
                "file_size": doc.file_size
            }
            
            # Get file size if not stored and file exists
            if file_exists and not doc.file_size:
                try:
                    document_info["file_size"] = os.path.getsize(doc.file_path)
                except:
                    document_info["file_size"] = None
            
            document_list.append(document_info)
        
        return {
            "success": True,
            "total_documents": len(document_list),
            "documents": document_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

@router.delete("/document/{document_id}")
async def delete_pdf_document(document_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific PDF document by ID.
    
    Args:
        document_id: ID of the document to delete
        db: Database session
        
    Returns:
        Dict with success message
    """
    try:
        # Find the document
        document = db.query(PDFDocument).filter(PDFDocument.id == document_id).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Remove the physical file if it exists
        if document.file_path and os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
                print(f"✅ Deleted file: {document.file_path}")
            except Exception as e:
                print(f"⚠ Warning: Could not delete file {document.file_path}: {e}")
        
        # Remove from database
        filename = document.original_filename
        db.delete(document)
        db.commit()
        
        return {"message": f"Document '{filename}' deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

@router.delete("/clear-history")
async def clear_all_history(db: Session = Depends(get_db)):
    """
    Clear all uploaded files and documents (complete history reset).
    
    Returns:
        Dict with success message and cleanup statistics
    """
    try:
        # Get counts before deletion
        total_documents = db.query(PDFDocument).count()
        
        # Delete all PDF documents from database
        db.query(PDFDocument).delete()
        
        # Remove all files from collections directory
        collections_dir = "data/collections"
        files_deleted = 0
        if os.path.exists(collections_dir):
            for filename in os.listdir(collections_dir):
                file_path = os.path.join(collections_dir, filename)
                if os.path.isfile(file_path):
                    try:
                        os.remove(file_path)
                        files_deleted += 1
                    except Exception as e:
                        print(f"⚠ Warning: Could not delete file {filename}: {e}")
        
        db.commit()
        
        return {
            "message": "All history cleared successfully",
            "statistics": {
                "documents_deleted": total_documents,
                "files_deleted": files_deleted
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")

@router.post("/repair-missing-paths")
async def repair_missing_file_paths(db: Session = Depends(get_db)):
    """
    Attempt to repair documents with missing file paths by matching them with files in collections directory.
    
    Returns:
        Dict with repair statistics
    """
    try:
        # Get documents with missing file paths
        documents_with_missing_paths = db.query(PDFDocument).filter(PDFDocument.file_path.is_(None)).all()
        
        if not documents_with_missing_paths:
            return {
                "message": "No documents with missing file paths found",
                "repaired_count": 0
            }
        
        collections_dir = "data/collections"
        if not os.path.exists(collections_dir):
            return {
                "message": "Collections directory does not exist",
                "repaired_count": 0
            }
        
        # Get all files in collections directory
        available_files = []
        for filename in os.listdir(collections_dir):
            file_path = os.path.join(collections_dir, filename)
            if os.path.isfile(file_path) and filename.endswith('.pdf'):
                available_files.append({
                    'filename': filename,
                    'path': file_path
                })
        
        repaired_count = 0
        
        # Try to match documents with files based on original filename
        for doc in documents_with_missing_paths:
            original_name = doc.original_filename
            
            # Look for files that contain the original filename
            for file_info in available_files:
                if original_name in file_info['filename']:
                    # Update the document's file path
                    doc.file_path = file_info['path']
                    repaired_count += 1
                    print(f"✅ Repaired: {original_name} -> {file_info['path']}")
                    break
        
        db.commit()
        
        return {
            "message": f"Repair completed. {repaired_count} documents repaired.",
            "total_documents_with_missing_paths": len(documents_with_missing_paths),
            "repaired_count": repaired_count,
            "available_files_count": len(available_files)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error repairing file paths: {str(e)}")

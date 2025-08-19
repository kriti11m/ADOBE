"""
PDF Documents Router
Handles PDF document CRUD operations
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import os

from app.services.pdf_service import PDFDocumentService

router = APIRouter(prefix="/documents", tags=["documents"])

# Pydantic models
class PDFDocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    upload_timestamp: datetime
    file_hash: Optional[str] = None
    is_active: bool = True
    title: Optional[str] = None
    pages: Optional[int] = None
    content_preview: Optional[str] = None

    class Config:
        from_attributes = True

class PDFDocumentUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None

class DocumentSearchRequest(BaseModel):
    query: str
    active_only: bool = True

# Routes

@router.get("/", response_model=List[PDFDocumentResponse])
async def get_all_documents(active_only: bool = True):
    """Get all PDF documents"""
    try:
        documents = PDFDocumentService.get_all_documents(active_only=active_only)
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {str(e)}")

@router.get("/{document_id}", response_model=PDFDocumentResponse)
async def get_document(document_id: int):
    """Get a specific PDF document by ID"""
    try:
        document = PDFDocumentService.get_document_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")

@router.get("/{document_id}/download")
async def download_document(document_id: int):
    """Download a PDF document file"""
    try:
        document = PDFDocumentService.get_document_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if not document.file_path or not os.path.exists(document.file_path):
            raise HTTPException(status_code=404, detail="Document file not found on disk")
        
        return FileResponse(
            path=document.file_path,
            filename=document.original_filename,
            media_type='application/pdf'
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download document: {str(e)}")

@router.post("/upload", response_model=PDFDocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None)
):
    """Upload a new PDF document"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Create the data directory if it doesn't exist
        import os
        import hashlib
        from datetime import datetime
        
        data_dir = "data"
        collections_dir = os.path.join(data_dir, "collections")
        os.makedirs(collections_dir, exist_ok=True)
        
        # Generate unique filename using hash
        file_content = await file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()
        unique_filename = f"{file_hash}_{file.filename}"
        file_path = os.path.join(collections_dir, unique_filename)
        
        # Save the file to disk
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Create database record with file path
        document = PDFDocumentService.create_document(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=len(file_content),
            title=title or file.filename.replace('.pdf', '')
        )
        
        print(f"✅ File saved successfully: {file_path}")
        return document
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@router.put("/{document_id}", response_model=PDFDocumentResponse)
async def update_document(document_id: int, updates: PDFDocumentUpdate):
    """Update a PDF document"""
    try:
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        document = PDFDocumentService.update_document(document_id, **update_data)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")

@router.delete("/{document_id}")
async def delete_document(document_id: int, permanent: bool = False):
    """Delete a PDF document"""
    try:
        success = PDFDocumentService.delete_document(document_id, soft_delete=not permanent)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@router.post("/search", response_model=List[PDFDocumentResponse])
async def search_documents(search_request: DocumentSearchRequest):
    """Search PDF documents"""
    try:
        documents = PDFDocumentService.search_documents(
            query=search_request.query,
            active_only=search_request.active_only
        )
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search documents: {str(e)}")

@router.get("/stats/summary")
async def get_document_stats():
    """Get document statistics"""
    try:
        all_docs = PDFDocumentService.get_all_documents(active_only=False)
        active_docs = [doc for doc in all_docs if doc.is_active]
        
        total_size = sum(doc.file_size or 0 for doc in active_docs)
        
        return {
            "total_documents": len(all_docs),
            "active_documents": len(active_docs),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2) if total_size > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

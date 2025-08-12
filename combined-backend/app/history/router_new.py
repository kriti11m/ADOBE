from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
from ..database.database import get_db
from ..services.history_service import HistoryService
from ..database.models import AnalysisSession, PDFDocument, ExtractedSection, GeneratedInsight
from sqlalchemy import func

# Create the router instance
router = APIRouter(prefix="/history", tags=["history"])

@router.get("/test")
async def test_history_endpoint():
    """Test endpoint to verify history router is working"""
    return {"message": "History router is working!", "status": "success"}

@router.get("/")
async def get_analysis_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get paginated analysis history"""
    try:
        history_service = HistoryService(db)
        history = history_service.get_analysis_history(limit=limit, offset=offset)
        
        return {
            "history": history,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": len(history)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@router.get("/session/{session_id}")
async def get_session_details(
    session_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get detailed information about a specific analysis session"""
    try:
        history_service = HistoryService(db)
        session_details = history_service.get_session_details(session_id)
        
        if not session_details:
            raise HTTPException(status_code=404, detail="Session not found")
            
        return session_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching session details: {str(e)}")

@router.get("/stats")
async def get_history_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get statistics about analysis history"""
    try:
        total_sessions = db.query(AnalysisSession).count()
        total_documents = db.query(PDFDocument).count()
        total_sections = db.query(ExtractedSection).count()
        total_insights = db.query(GeneratedInsight).count()
        
        # Get most common personas
        common_personas = (
            db.query(AnalysisSession.persona, func.count(AnalysisSession.persona))
            .group_by(AnalysisSession.persona)
            .order_by(func.count(AnalysisSession.persona).desc())
            .limit(5)
            .all()
        )
        
        return {
            "total_sessions": total_sessions,
            "total_documents": total_documents,
            "total_sections_extracted": total_sections,
            "total_insights_generated": total_insights,
            "most_common_personas": [
                {"persona": persona, "count": count}
                for persona, count in common_personas
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching statistics: {str(e)}")

@router.get("/document/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Download a PDF document from history by document ID"""
    try:
        document = db.query(PDFDocument).filter(PDFDocument.id == document_id).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # Check if file exists
        if not document.file_path or not os.path.exists(document.file_path):
            raise HTTPException(status_code=404, detail="PDF file not found on disk")
            
        return FileResponse(
            path=document.file_path,
            media_type="application/pdf",
            filename=document.filename
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading document: {str(e)}")

@router.get("/document/{document_id}/blob")
async def get_document_blob(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Get PDF document as blob data for Adobe Embed API"""
    try:
        document = db.query(PDFDocument).filter(PDFDocument.id == document_id).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # Check if file exists
        if not document.file_path or not os.path.exists(document.file_path):
            raise HTTPException(status_code=404, detail="PDF file not found on disk")
            
        # Read file and return as response
        with open(document.file_path, 'rb') as file:
            pdf_content = file.read()
            
        from fastapi.responses import Response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={document.filename}",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting document blob: {str(e)}")

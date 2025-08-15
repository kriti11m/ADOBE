"""
Text Selection Router
Core feature: Text selection -> Cross-document insights
Adobe Hackathon Finale requirement
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from .service import text_selection_service

router = APIRouter(prefix="/text-selection", tags=["text-selection"])

class TextSelectionRequest(BaseModel):
    selected_text: str
    document_id: Optional[int] = None
    context: Optional[str] = None  # Additional context around selection
    min_similarity: float = 0.3
    max_results: int = 5

class RelatedSection(BaseModel):
    document_id: int
    document_title: str
    document_filename: str
    snippet_text: str
    similarity_score: float
    section_title: str
    page_number: int
    context: str
    snippet_id: str

class TextSelectionResponse(BaseModel):
    selected_text: str
    related_sections: List[RelatedSection]
    total_found: int
    processing_time_ms: int

class SnippetNavigationRequest(BaseModel):
    document_id: int
    snippet_id: str

@router.post("/find-related", response_model=TextSelectionResponse)
async def find_related_sections(request: TextSelectionRequest):
    """
    Core Feature: Find related sections across PDFs based on selected text
    
    This is the main feature required for the finale:
    1. User selects text in current PDF
    2. System finds semantically similar sections in other PDFs
    3. Returns relevant snippets for user to explore
    """
    import time
    start_time = time.time()
    
    try:
        if not request.selected_text or len(request.selected_text.strip()) < 5:
            raise HTTPException(
                status_code=400, 
                detail="Selected text must be at least 5 characters long"
            )
        
        # Find related sections using semantic search
        related_sections = text_selection_service.find_related_sections(
            selected_text=request.selected_text,
            document_id=request.document_id,
            min_similarity=request.min_similarity,
            max_results=request.max_results
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Convert to response format
        related_section_models = [
            RelatedSection(
                document_id=section["document_id"],
                document_title=section["document_title"],
                document_filename=section["document_filename"],
                snippet_text=section["snippet_text"],
                similarity_score=section["similarity_score"],
                section_title=section["section_title"],
                page_number=section["page_number"],
                context=section["context"],
                snippet_id=section["snippet_id"]
            )
            for section in related_sections
        ]
        
        return TextSelectionResponse(
            selected_text=request.selected_text,
            related_sections=related_section_models,
            total_found=len(related_section_models),
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding related sections: {str(e)}")

@router.post("/navigate-to-snippet")
async def navigate_to_snippet(request: SnippetNavigationRequest):
    """
    Handle snippet click navigation
    Returns document context for PDF navigation
    """
    try:
        context = text_selection_service.get_document_context(
            document_id=request.document_id,
            snippet_id=request.snippet_id
        )
        
        if "error" in context:
            raise HTTPException(status_code=404, detail=context["error"])
        
        return {
            "success": True,
            "document": context,
            "message": f"Ready to navigate to {context['filename']}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Navigation error: {str(e)}")

@router.get("/test-similarity")
async def test_similarity(text1: str, text2: str):
    """
    Test endpoint for semantic similarity calculation
    Useful for debugging and demonstrating the core algorithm
    """
    try:
        similarity = text_selection_service.calculate_similarity(text1, text2)
        
        return {
            "text1": text1,
            "text2": text2,
            "similarity_score": similarity,
            "interpretation": (
                "High similarity" if similarity > 0.7 else
                "Medium similarity" if similarity > 0.4 else
                "Low similarity"
            )
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity calculation error: {str(e)}")

@router.get("/health")
async def health_check():
    """Check if text selection service is working"""
    return {
        "status": "healthy",
        "service": "Text Selection Service",
        "model_loaded": text_selection_service.model is not None,
        "features": [
            "Cross-document semantic search",
            "Snippet extraction",
            "Similarity scoring",
            "PDF navigation"
        ]
    }

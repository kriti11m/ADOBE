"""
FastAPI router for Part 1A (PDF Structure Extractor)
Extracts title and headings from PDF files
"""

import tempfile
import os
from pathlib import Path
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from .pdf_structure_extractor import MultilingualPDFExtractor

router = APIRouter(prefix="/part1a", tags=["PDF Structure Extraction"])

@router.post("/extract")
async def extract_pdf_structure(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Extract title and heading structure from a PDF file.
    
    Args:
        file: Uploaded PDF file
        
    Returns:
        Dict containing title and outline structure with page numbers
    """
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Create temporary file to store uploaded PDF
    temp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(temp_dir, f"temp_{file.filename}")
    
    try:
        # Save uploaded file to temporary location
        with open(temp_file_path, "wb") as temp_file:
            content = await file.read()
            temp_file.write(content)
        
        # Initialize extractor and process the PDF
        extractor = MultilingualPDFExtractor()
        result = extractor.extract_structure(temp_file_path)
        
        # Add metadata
        result["metadata"] = {
            "filename": file.filename,
            "file_size_bytes": len(content),
            "service": "PDF Structure Extractor (Part 1A)"
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass

@router.get("/health")
async def health_check():
    """Health check endpoint for Part 1A"""
    return {"status": "healthy", "service": "PDF Structure Extractor (Part 1A)"}

@router.get("/info")
async def get_service_info():
    """Get information about the PDF Structure Extractor service"""
    return {
        "service": "PDF Structure Extractor (Part 1A)",
        "description": "Extracts title and headings (H1, H2, H3) from PDF files with page numbers",
        "features": [
            "Multilingual support",
            "Font analysis",
            "Spatial reasoning",
            "Content pattern recognition",
            "Offline processing"
        ],
        "supported_formats": ["PDF"],
        "output_format": {
            "title": "Document title",
            "outline": [
                {
                    "level": "Heading level (Title, H1, H2, H3)",
                    "text": "Heading text",
                    "page": "Zero-indexed page number"
                }
            ]
        }
    }

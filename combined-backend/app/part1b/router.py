import tempfile
import os
import json
import time
from pathlib import Path
from typing import Dict, Any, List
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.responses import JSONResponse

from .pipeline import DocumentAnalysisPipeline
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..database.models import PDFDocument
# history_service removed

router = APIRouter(prefix="/part1b", tags=["Document Analysis"])

class AnalysisRequest(BaseModel):
    """Request model for document analysis"""
    persona: str = "Researcher"
    job: str = "Analyze document content and extract relevant sections"

@router.post("/analyze")
async def analyze_documents(
    persona: str = Form("Researcher"),
    job: str = Form("Analyze document content and extract relevant sections"),
    profile_id: int = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze PDF documents and store complete history in database
    """
    
    # Validate files
    pdf_files = []
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400, 
                detail=f"Only PDF files are allowed. Invalid file: {file.filename}"
            )
        pdf_files.append(file)

    if len(pdf_files) == 0:
        raise HTTPException(status_code=400, detail="At least one PDF file is required")

    # Create temporary directory for uploaded files
    temp_dir = tempfile.mkdtemp()
    temp_file_paths = []
    
    try:
        # History service removed - no longer storing documents
        
        # Save uploaded files temporarily for processing
        for file in pdf_files:
            temp_file_path = os.path.join(temp_dir, file.filename)
            temp_file_paths.append(temp_file_path)
            
            with open(temp_file_path, "wb") as temp_file:
                content = await file.read()
                temp_file.write(content)

        # Process documents
        start_time = time.time()
        pipeline = DocumentAnalysisPipeline()
        result = pipeline.process_documents(
            pdf_paths=temp_file_paths,
            persona=persona,
            job=job
        )
        processing_time = time.time() - start_time

        # History service removed - no longer creating sessions or storing sections
        # Return processing results without session tracking
        result['processing_time'] = processing_time
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing documents: {str(e)}")
    
    finally:
        # Clean up temporary files
        for temp_file_path in temp_file_paths:
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
        try:
            os.rmdir(temp_dir)
        except:
            pass

@router.post("/analyze-single")
async def analyze_single_document(
    file: UploadFile = File(...),
    persona: str = Form("Researcher"),
    job: str = Form("Analyze document content and extract relevant sections"),
    profile_id: int = Form(None)
) -> Dict[str, Any]:
    """
    Analyze a single PDF document.
    
    Args:
        file: Uploaded PDF file
        persona: User role/persona
        job: Specific task to accomplish
        
    Returns:
        Dict containing analysis results
    """
    return await analyze_documents(persona=persona, job=job, profile_id=profile_id, files=[file])

@router.post("/analyze-collection")
async def analyze_collection(
    collection_id: int = Form(...),
    persona: str = Form("Researcher"),
    job: str = Form("Analyze document content and extract relevant sections"),
    profile_id: int = Form(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze all documents in a collection by collection ID
    NOTE: Collections functionality removed - this endpoint is deprecated
    """
    raise HTTPException(status_code=501, detail="Collections functionality has been removed. Use individual document analysis instead.")
    for doc in documents:
        file_path = doc.file_path
        
        # Check if file exists at stored path
        if not os.path.exists(file_path):
            # Try to find the file in collections directory (same logic as blob endpoint)
            collections_path = os.path.abspath("data/collections")
            found_file = None
            
            if os.path.exists(collections_path):
                for root, dirs, files in os.walk(collections_path):
                    # Try exact filename match first
                    if doc.filename in files:
                        potential_path = os.path.join(root, doc.filename)
                        if os.path.exists(potential_path):
                            found_file = potential_path
                            print(f"🔍 Found file in collections: {found_file}")
                            # Update the database with the correct path
                            doc.file_path = found_file
                            db.commit()
                            file_path = found_file
                            break
                    
                    # If exact match not found, try partial matches
                    if not found_file:
                        for file in files:
                            if os.path.basename(doc.filename) == file:
                                potential_path = os.path.join(root, file)
                                if os.path.exists(potential_path):
                                    found_file = potential_path
                                    print(f"🔍 Found file by basename in collections: {found_file}")
                                    doc.file_path = found_file
                                    db.commit()
                                    file_path = found_file
                                    break
                        if found_file:
                            break
            
            # If still not found, raise error
            if not found_file:
                raise HTTPException(status_code=404, detail=f"Document file not found: {doc.file_path}")
        
        pdf_paths.append(file_path)
    
    try:
        # Initialize pipeline
        pipeline = DocumentAnalysisPipeline()
        
        # Process documents with the provided pipeline
        results = pipeline.process_documents(pdf_paths, persona, job)
        
        # History service removed - no longer storing sessions
        # Return results without session tracking
        return {
            "collection_id": collection_id,
            "collection_name": collection.name,
            "document_count": len(documents),
            "extracted_sections": results.get("extracted_sections", []),
            "processing_time": results.get("processing_time", 0),
            "recommendations": results.get("extracted_sections", [])  # For backward compatibility
        }
        
    except Exception as e:
        print(f"Error in collection analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for Part 1B"""
    return {"status": "healthy", "service": "Document Analysis System (Part 1B)"}

@router.get("/info")
async def get_service_info():
    """Get information about the Document Analysis service"""
    return {
        "service": "Document Analysis System (Part 1B)",
        "description": "Extracts and ranks relevant sections from PDF documents based on user personas and tasks",
        "features": [
            "Semantic analysis using sentence transformers",
            "User persona-based relevance ranking",
            "Section detection and extraction",
            "Subsection analysis",
            "Multi-document processing"
        ],
        "supported_formats": ["PDF"],
        "input_parameters": {
            "persona": "User role (e.g., Researcher, Student, Analyst)",
            "job": "Specific task description"
        },
        "output_format": {
            "metadata": "Processing information and timestamps",
            "extracted_sections": "Top 5 relevant sections with rankings",
            "subsection_analysis": "Refined text content with page numbers"
        }
    }

@router.get("/sample-personas")
async def get_sample_personas():
    """Get sample personas and job descriptions for testing"""
    return {
        "sample_personas": [
            {
                "persona": "PhD Researcher",
                "sample_jobs": [
                    "Prepare literature review focusing on methodologies",
                    "Extract key findings and conclusions",
                    "Identify research gaps and future directions"
                ]
            },
            {
                "persona": "Investment Analyst", 
                "sample_jobs": [
                    "Analyze revenue trends and market positioning",
                    "Extract financial performance indicators",
                    "Identify risk factors and opportunities"
                ]
            },
            {
                "persona": "Student",
                "sample_jobs": [
                    "Identify key concepts for exam preparation", 
                    "Extract main definitions and formulas",
                    "Find examples and case studies"
                ]
            },
            {
                "persona": "Business Analyst",
                "sample_jobs": [
                    "Extract executive summary and recommendations",
                    "Identify business requirements and specifications",
                    "Analyze market trends and competitive landscape"
                ]
            }
        ]
    }

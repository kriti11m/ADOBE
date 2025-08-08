"""
FastAPI router for Part 1B (Document Analysis System)
Extracts and ranks relevant sections from PDF documents based on user personas and tasks
"""

import tempfile
import os
import json
from pathlib import Path
from typing import Dict, Any, List
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse

from .pipeline import DocumentAnalysisPipeline

router = APIRouter(prefix="/part1b", tags=["Document Analysis"])

class AnalysisRequest(BaseModel):
    """Request model for document analysis"""
    persona: str = "Researcher"
    job: str = "Analyze document content and extract relevant sections"

@router.post("/analyze")
async def analyze_documents(
    persona: str = Form("Researcher"),
    job: str = Form("Analyze document content and extract relevant sections"),
    files: List[UploadFile] = File(...)
) -> Dict[str, Any]:
    """
    Analyze PDF documents and extract relevant sections based on user persona and job.
    
    Args:
        persona: User role/persona (e.g., "Researcher", "Student", "Analyst")
        job: Specific task to accomplish
        files: List of uploaded PDF files
        
    Returns:
        Dict containing analysis results with ranked relevant sections
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
        # Save uploaded files to temporary location
        for file in pdf_files:
            temp_file_path = os.path.join(temp_dir, file.filename)
            temp_file_paths.append(temp_file_path)
            
            with open(temp_file_path, "wb") as temp_file:
                content = await file.read()
                temp_file.write(content)
        
        # Initialize pipeline and process the documents
        pipeline = DocumentAnalysisPipeline()
        result = pipeline.process_documents(
            pdf_paths=temp_file_paths,
            persona=persona,
            job=job
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing documents: {str(e)}")
    
    finally:
        # Clean up temporary files
        import shutil
        try:
            shutil.rmtree(temp_dir)
        except:
            pass

@router.post("/analyze-single")
async def analyze_single_document(
    file: UploadFile = File(...),
    persona: str = Form("Researcher"),
    job: str = Form("Analyze document content and extract relevant sections")
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
    return await analyze_documents(persona=persona, job=job, files=[file])

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

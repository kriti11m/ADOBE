"""
FastAPI router for Insights generation using Gemini 2.5 Flash
Provides endpoints for generating insights, facts, and podcasts from Part 1B output
"""

import os
import tempfile
import shutil
from typing import Dict, Any, List
from pathlib import Path
from datetime import datetime
import time

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from sqlalchemy.orm import Session
from ..database.database import get_db
from ..services.history_service import HistoryService

from .gemini_generator import GeminiInsightsGenerator
from ..part1b.pipeline import DocumentAnalysisPipeline


router = APIRouter(prefix="/insights", tags=["Insights Generation"])


class InsightsRequest(BaseModel):
    """Request model for insights generation"""
    persona: str = "Researcher"
    job: str = "Analyze document content and extract key insights"


@router.post("/generate")
async def generate_insights_from_files(
    persona: str = Form("Researcher"),
    job: str = Form("Analyze document content and extract key insights"),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate comprehensive insights and store complete session history
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
        raise HTTPException(
            status_code=400,
            detail="At least one PDF file is required"
        )
    
    temp_dir = tempfile.mkdtemp()
    temp_file_paths = []
    
    try:
        # Initialize history service
        history_service = HistoryService(db)
        stored_documents = []
        
        # Process files and store documents
        for file in pdf_files:
            temp_file_path = os.path.join(temp_dir, file.filename)
            temp_file_paths.append(temp_file_path)
            
            with open(temp_file_path, "wb") as temp_file:
                content = await file.read()
                temp_file.write(content)
                
                # Store in database
                pdf_doc = history_service.store_pdf_document(
                    filename=file.filename,
                    file_content=content,
                    file_path=temp_file_path
                )
                stored_documents.append(pdf_doc)

        print(f"Processing {len(temp_file_paths)} PDF files for insights generation...")
        
        # Step 1: Use Part 1B pipeline
        start_time = time.time()
        pipeline = DocumentAnalysisPipeline()
        part1b_result = pipeline.process_documents(
            pdf_paths=temp_file_paths,
            persona=persona,
            job=job
        )
        
        # Step 2: Generate insights using Gemini
        insights_generator = GeminiInsightsGenerator()
        insights_result = insights_generator.generate_comprehensive_insights(part1b_result)
        
        processing_time = time.time() - start_time
        
        # Create analysis session
        session = history_service.create_analysis_session(
            persona=persona,
            job_description=job,
            pdf_documents=stored_documents,
            processing_time=processing_time
        )
        
        # Store extracted sections
        if 'extracted_sections' in part1b_result:
            history_service.store_extracted_sections(
                session_id=session.id,
                sections=part1b_result['extracted_sections']
            )
        
        # Store generated insights
        if 'insights' in insights_result:
            history_service.store_generated_insights(
                session_id=session.id,
                insights=insights_result['insights']
            )
        
        # Combine results
        final_result = {
            "session_id": session.id,
            "part1b_analysis": part1b_result,
            "insights": insights_result,
            "metadata": {
                "files_processed": len(pdf_files),
                "persona": persona,
                "job": job,
                "processing_time_seconds": processing_time,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        return final_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")
    
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


@router.post("/generate-from-sections")
async def generate_insights_from_sections(
    request_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate insights from already extracted sections (Part 1B output).
    
    Args:
        request_data: Part 1B output containing extracted sections and metadata
        
    Returns:
        Dict containing insights generated from the sections
    """
    
    try:
        # Validate input
        if "extracted_sections" not in request_data:
            raise HTTPException(
                status_code=400,
                detail="extracted_sections is required in request data"
            )
        
        # Generate insights
        insights_generator = GeminiInsightsGenerator()
        insights_result = insights_generator.generate_comprehensive_insights(request_data)
        
        return {
            "insights": insights_result,
            "input_sections_count": len(request_data.get("extracted_sections", [])),
            "metadata": request_data.get("metadata", {})
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating insights from sections: {str(e)}"
        )


@router.post("/key-insights")
async def generate_key_insights_only(
    sections: List[Dict[str, Any]],
    persona: str = "Researcher",
    job: str = "Analyze content"
) -> Dict[str, Any]:
    """Generate only key insights from sections"""
    
    try:
        insights_generator = GeminiInsightsGenerator()
        return insights_generator.generate_key_insights(sections, persona, job)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating key insights: {str(e)}"
        )


@router.post("/did-you-know")
async def generate_facts_only(
    sections: List[Dict[str, Any]],
    persona: str = "Student"
) -> Dict[str, Any]:
    """Generate only 'Did you know?' facts from sections"""
    
    try:
        insights_generator = GeminiInsightsGenerator()
        return insights_generator.generate_did_you_know_facts(sections, persona)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating facts: {str(e)}"
        )


@router.post("/contradictions")
async def find_contradictions_only(
    sections: List[Dict[str, Any]],
    persona: str = "Researcher"
) -> Dict[str, Any]:
    """Find only contradictions and connections from sections"""
    
    try:
        insights_generator = GeminiInsightsGenerator()
        return insights_generator.find_contradictions_and_connections(sections, persona)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error finding contradictions: {str(e)}"
        )


@router.post("/podcast")
async def generate_podcast_only(
    sections: List[Dict[str, Any]],
    persona: str = "Student",
    job: str = "Learn key concepts",
    topic: str = None
) -> Dict[str, Any]:
    """Generate only podcast script from sections"""
    
    try:
        insights_generator = GeminiInsightsGenerator()
        return insights_generator.generate_podcast_script(sections, persona, job, topic)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating podcast: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for Insights service"""
    
    try:
        # Check if Gemini API key is available
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return {
                "status": "unhealthy",
                "service": "Insights Generation Service",
                "error": "GEMINI_API_KEY not configured"
            }
        
        return {
            "status": "healthy",
            "service": "Insights Generation Service",
            "model": "gemini-1.5-flash",
            "api_key_configured": True
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "Insights Generation Service",
            "error": str(e)
        }


@router.get("/info")
async def get_service_info():
    """Get information about the Insights Generation service"""
    
    return {
        "service": "Insights Generation Service",
        "description": "Generates AI-powered insights, facts, and content using Gemini 2.5 Flash",
        "features": [
            "Key insights extraction",
            "Did you know facts generation",
            "Contradiction and connection analysis",
            "Podcast script generation",
            "Multi-document analysis"
        ],
        "model": "gemini-1.5-flash",
        "supported_formats": ["PDF"],
        "input_requirements": {
            "persona": "User role (e.g., Student, Researcher)",
            "job": "Specific task description",
            "files": "One or more PDF documents"
        },
        "output_format": {
            "key_insights": "Actionable insights with relevance scores",
            "did_you_know_facts": "Surprising educational facts",
            "contradictions_and_connections": "Analysis of document relationships",
            "podcast_script": "2-5 minute educational podcast script"
        }
    }


@router.get("/sample-requests")
async def get_sample_requests():
    """Get sample persona and job combinations for testing"""
    
    return {
        "sample_requests": [
            {
                "persona": "Undergraduate Chemistry Student",
                "job": "Identify key concepts and mechanisms for exam preparation on reaction kinetics",
                "expected_insights": "Chemical reaction mechanisms, rate laws, activation energy concepts"
            },
            {
                "persona": "Medical Researcher",
                "job": "Extract clinical trial methodologies and statistical approaches",
                "expected_insights": "Study design patterns, statistical significance measures, bias mitigation"
            },
            {
                "persona": "Investment Analyst",
                "job": "Analyze financial performance and market positioning trends",
                "expected_insights": "Revenue patterns, competitive advantages, market risk factors"
            },
            {
                "persona": "PhD Literature Student",
                "job": "Identify thematic patterns and literary techniques across multiple works",
                "expected_insights": "Recurring themes, narrative structures, comparative analysis"
            },
            {
                "persona": "Software Engineering Manager",
                "job": "Extract best practices and architectural patterns from technical documentation",
                "expected_insights": "Design patterns, scalability approaches, implementation strategies"
            }
        ]
    }

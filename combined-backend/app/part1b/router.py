import tempfile
import os
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.responses import JSONResponse

from .pipeline import DocumentAnalysisPipeline
from .relevance_analyzer import RelevanceAnalyzer
from ..part1a.pdf_structure_extractor import MultilingualPDFExtractor
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..database.models import PDFDocument
from ..text_selection.service import TextSelectionService

router = APIRouter(prefix="/part1b", tags=["Document Analysis"])

class TextAnalysisRequest(BaseModel):
    """Request model for text-based analysis"""
    selected_text: str
    document_id: Optional[int] = None

class LegacyTextAnalysisRequest(BaseModel):
    """Request model for legacy text analysis with persona/job"""
    text: str
    persona: str = "Researcher"
    job: str = "Analyze document content and extract relevant sections"

class AnalysisRequest(BaseModel):
    """Request model for document analysis (legacy)"""
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

class TextAnalysisRequest(BaseModel):
    """Request model for direct text analysis"""
    text: str
    persona: str = "Researcher"
    job: str = "Analyze content and extract key information"

@router.post("/analyze-text")
async def analyze_text(request: LegacyTextAnalysisRequest) -> Dict[str, Any]:
    """
    Analyze text directly without PDF processing - Enhanced with Gemini LLM
    Perfect for testing the analysis pipeline with sample text
    """
    try:
        # Initialize the pipeline
        pipeline = DocumentAnalysisPipeline()
        
        # Create a mock document structure from the text
        mock_sections = [
            {
                "text": request.text,
                "content": request.text,  # Add both for compatibility
                "page": 1,
                "section_title": "Direct Text Input",
                "section_type": "direct_input",
                "document": "text_input",
                "metadata": {
                    "source": "text_input",
                    "length": len(request.text)
                }
            }
        ]
        
        start_time = time.time()
        
        # Process the text through the analysis pipeline with Gemini enhancement
        if pipeline.relevance_analyzer:
            print(f"🚀 Analyzing text with Gemini LLM enhancement...")
            print(f"   Persona: {request.persona}")
            print(f"   Job: {request.job}")
            print(f"   Text length: {len(request.text)} characters")
            
            # Use the enhanced relevance analyzer (now with Gemini)
            ranked_sections = pipeline.relevance_analyzer.rank_sections(
                sections=mock_sections,
                persona=request.persona,
                job=request.job
            )
            
            analyzed_sections = {
                "top_sections": [
                    {
                        "text": section["text"][:1000] + ("..." if len(section["text"]) > 1000 else ""),
                        "relevance_score": section.get("relevance_score", 0.0),
                        "page": section.get("page", 1),
                        "section_title": section.get("section_title", ""),
                        "importance_rank": section.get("importance_rank", 1),
                        "gemini_analysis": section.get("gemini_analysis", {}),
                        "reasoning": section.get("gemini_analysis", {}).get("reasoning", "Standard analysis")
                    } for section in ranked_sections[:5]  # Top 5 sections
                ],
                "analysis_metadata": {
                    "total_sections": len(ranked_sections),
                    "processing_time": time.time() - start_time,
                    "analyzer_status": "gemini_enhanced" if ranked_sections and ranked_sections[0].get("gemini_analysis") else "fallback_mode",
                    "gemini_enabled": pipeline.relevance_analyzer.use_gemini_enhancement
                }
            }
        else:
            # Fallback: just return the input with basic analysis
            analyzed_sections = {
                "top_sections": [
                    {
                        "text": request.text[:1000] + ("..." if len(request.text) > 1000 else ""),
                        "relevance_score": 0.8,
                        "page": 1,
                        "reasoning": "Direct text input - no ranking performed (analyzer unavailable)"
                    }
                ],
                "analysis_metadata": {
                    "total_sections": 1,
                    "processing_time": time.time() - start_time,
                    "analyzer_status": "fallback_mode",
                    "gemini_enabled": False
                }
            }
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "metadata": {
                "persona": request.persona,
                "job": request.job,
                "text_length": len(request.text),
                "processing_time": processing_time,
                "timestamp": datetime.now().isoformat(),
                "gemini_enhanced": analyzed_sections["analysis_metadata"].get("gemini_enabled", False)
            },
            "analysis_results": analyzed_sections,
            "input_preview": request.text[:200] + ("..." if len(request.text) > 200 else "")
        }
    except Exception as e:
        print(f"❌ Text analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Text analysis failed: {str(e)}"
        )
        
    except Exception as e:
        print(f"❌ Text analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Text analysis failed: {str(e)}"
        )

@router.post("/find-relevant-sections")
async def find_relevant_sections(
    request: TextAnalysisRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    NEW FINALE ENDPOINT: Find relevant sections based on selected text
    Uses: Part 1A for section detection + Gemini for relevance + Sentence transformers as fallback
    Input: Selected text from PDF
    Output: Top 5 relevant sections with 2-3 sentence snippets
    """
    start_time = time.time()
    
    try:
        print(f"🚀 Finding relevant sections for selected text: {request.selected_text[:100]}...")
        
        # Initialize services
        relevance_analyzer = RelevanceAnalyzer()
        text_service = TextSelectionService()
        
        # Get all PDF documents from database for cross-document search
        documents = db.query(PDFDocument).all()
        
        if not documents:
            return {
                "success": False,
                "error": "No documents found. Please upload a PDF first.",
                "relevant_sections": []
            }
        
        print(f"📚 Searching across {len(documents)} documents...")
        
        all_sections = []
        
        # Process each document to extract sections using Part 1A
        for doc in documents:
            try:
                if not doc.file_path or not os.path.exists(doc.file_path):
                    continue
                    
                print(f"📄 Processing document: {doc.original_filename}")
                
                # Use Part 1A PDF Structure Extractor for section detection
                extractor = MultilingualPDFExtractor()
                sections = extractor.extract_sections_from_pdf(doc.file_path)
                
                # Convert sections to format compatible with relevance analyzer
                for section in sections:
                    processed_section = {
                        'content': section.get('content', ''),
                        'section_title': section.get('title', 'Untitled Section'),
                        'document_name': doc.original_filename,
                        'document_id': doc.id,
                        'page': section.get('page', 'Unknown'),
                        'metadata': {
                            'extracted_by': 'part1a',
                            'section_type': section.get('type', 'content')
                        }
                    }
                    
                    if len(processed_section['content']) > 50:  # Filter out very short sections
                        all_sections.append(processed_section)
                        
            except Exception as e:
                print(f"⚠️ Error processing document {doc.original_filename}: {e}")
                continue
        
        if not all_sections:
            return {
                "success": False,
                "error": "No content sections found in uploaded documents",
                "relevant_sections": []
            }
        
        print(f"🔍 Found {len(all_sections)} sections across all documents")
        
        # Calculate relevance scores for each section using Gemini + sentence transformers
        scored_sections = []
        
        for section in all_sections:
            try:
                # Use the enhanced relevance analyzer with Gemini + semantic fallback
                relevance_score = relevance_analyzer.calculate_text_similarity_score(
                    section, request.selected_text
                )
                
                # Create snippet (2-3 sentences from the section)
                content = section['content']
                sentences = content.split('. ')
                snippet = '. '.join(sentences[:3]) + ('.' if len(sentences) > 3 else '')
                
                scored_section = {
                    'section_title': section['section_title'],
                    'document_name': section['document_name'],
                    'document_id': section['document_id'],
                    'page': section['page'],
                    'relevance_score': relevance_score,
                    'snippet': snippet,
                    'content_preview': content[:200] + ('...' if len(content) > 200 else ''),
                    'enhanced_analysis': section.get('gemini_analysis', {}),
                    'metadata': section.get('metadata', {})
                }
                
                scored_sections.append(scored_section)
                
            except Exception as e:
                print(f"⚠️ Error scoring section '{section['section_title']}': {e}")
                continue
        
        # Sort by relevance score (highest first) and take top 5
        scored_sections.sort(key=lambda x: x['relevance_score'], reverse=True)
        top_sections = scored_sections[:5]
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "selected_text": request.selected_text,
            "selected_text_preview": request.selected_text[:100] + ('...' if len(request.selected_text) > 100 else ''),
            "total_sections_analyzed": len(all_sections),
            "relevant_sections": top_sections,
            "metadata": {
                "processing_time": processing_time,
                "timestamp": datetime.now().isoformat(),
                "documents_searched": len(documents),
                "analysis_method": "gemini_enhanced_with_semantic_fallback",
                "top_sections_count": len(top_sections)
            }
        }
        
    except Exception as e:
        print(f"❌ Error in find_relevant_sections: {e}")
        return {
            "success": False,
            "error": str(e),
            "relevant_sections": []
        }

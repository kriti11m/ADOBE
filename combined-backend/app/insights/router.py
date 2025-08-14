"""
FastAPI router for Insights generation using Gemini 2.5 Flash
Provides endpoints for generating insights, facts, and podcasts from Part 1B output
"""

import os
import tempfile
import shutil
from typing import Dict, Any, List, Optional
from pathlib import Path
from datetime import datetime
import time

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from sqlalchemy.orm import Session
from ..database.database import get_db
# history models removed: ExtractedSection, AnalysisSession
# history_service removed
from ..services.tts_service import tts_service

from .gemini_generator import GeminiInsightsGenerator
from ..part1b.pipeline import DocumentAnalysisPipeline


def _get_all_session_sections(db: Session, session_id: int) -> List[Dict]:
    """
    Fetch all extracted sections from a session for comprehensive cross-document analysis
    """
    try:
        sections = db.query(ExtractedSection).filter(
            ExtractedSection.session_id == session_id
        ).all()
        
        return [
            {
                "document": section.document_name,
                "page_number": section.page_number,
                "section_title": section.section_title,
                "content": section.content or "",
                "relevance_score": section.relevance_score or 0,
                "importance_rank": section.importance_rank or 999
            }
            for section in sections
        ]
    except Exception as e:
        print(f"Error fetching session sections: {e}")
        return []


def get_insights_generator():
    """Lazy loading of GeminiInsightsGenerator to avoid startup issues"""
    return GeminiInsightsGenerator()


def _generate_fallback_podcast_script(sections: List[Dict[str, Any]], persona: str, job: str) -> Dict[str, Any]:
    """
    Generate a simple podcast script without AI when API quota is exceeded
    """
    try:
        # Extract content from sections
        section_contents = []
        documents = set()
        
        for section in sections:
            if section.get('content'):
                section_contents.append({
                    'title': section.get('section_title', 'Untitled Section'),
                    'content': section.get('content', ''),
                    'document': section.get('document', 'Unknown Document'),
                    'page': section.get('page_number', 1)
                })
                documents.add(section.get('document', 'Unknown Document'))
        
        # Create a simple script structure
        script_parts = [
            f"Welcome to today's AI-generated podcast about {', '.join(list(documents)[:2])}{'...' if len(documents) > 2 else ''}.",
            f"I'm your AI host, and we'll be exploring insights from {len(section_contents)} key sections.",
            "",
            "Let's dive into the content:"
        ]
        
        # Add each section as a podcast segment
        for i, section in enumerate(section_contents, 1):
            script_parts.extend([
                "",
                f"Section {i}: {section['title']}",
                f"From {section['document']}, page {section['page']}",
                "",
                section['content'][:500] + ("..." if len(section['content']) > 500 else ""),
                ""
            ])
        
        # Add closing
        script_parts.extend([
            "",
            "That concludes our exploration of these documents.",
            "Thank you for listening to this AI-generated podcast.",
            "Until next time!"
        ])
        
        script_text = "\n".join(script_parts)
        
        return {
            "title": f"Document Analysis: {', '.join(list(documents)[:2])}{'...' if len(documents) > 2 else ''}",
            "description": f"An AI-generated podcast exploring {len(section_contents)} key sections from your documents.",
            "script": script_text,
            "estimated_duration": f"{max(2, len(script_text) // 200)} minutes",
            "key_takeaways": [
                f"Explored {len(section_contents)} important sections",
                f"Analyzed content from {len(documents)} document(s)",
                "Generated without AI enhancement due to API limitations"
            ],
            "fallback_mode": True
        }
        
    except Exception as e:
        print(f"❌ Error generating fallback script: {e}")
        return {
            "title": "Simple Podcast",
            "description": "A basic podcast script",
            "script": "Welcome to this AI-generated podcast. We encountered some technical difficulties but wanted to provide you with basic content from your documents.",
            "estimated_duration": "2 minutes",
            "key_takeaways": ["Basic content provided", "Technical limitations encountered"],
            "fallback_mode": True
        }


def _get_enhanced_section_content(section: Dict, subsection_analysis: List[Dict]) -> str:
    """
    Get enhanced content for a section by combining title and refined text
    with better formatting for insights generation
    """
    # Get the refined text for this section
    refined_text = ""
    for subsection in subsection_analysis:
        if (subsection.get('document') == section['document'] and 
            subsection.get('page_number') == section['page_number']):
            refined_text = subsection.get('refined_text', '')
            break
    
    if not refined_text:
        return ""
    
    # Create enhanced content with clear structure
    section_title = section.get('section_title', '')
    
    # Format the content for better AI processing
    enhanced_content = f"""
Section: {section_title}
Document: {section['document']}
Page: {section['page_number']}

Content:
{refined_text}

This section was identified as rank #{section['importance_rank']} most important for the user's needs.
""".strip()
    
    return enhanced_content


def _get_fallback_content(subsection_analysis: List[Dict], document: str, page_number: int) -> str:
    """Get fallback content from subsection_analysis"""
    for subsection in subsection_analysis:
        if (subsection.get('document') == document and 
            subsection.get('page_number') == page_number):
            return subsection.get('refined_text', '')
    return ""


router = APIRouter(prefix="/insights", tags=["Insights Generation"])


class Part1BOutputRequest(BaseModel):
    """Request model for insights generation from Part 1B output"""
    metadata: Dict[str, Any]
    extracted_sections: List[Dict[str, Any]]
    subsection_analysis: List[Dict[str, Any]]


@router.post("/generate-from-part1b")
async def generate_insights_from_part1b_output(request: Part1BOutputRequest) -> Dict[str, Any]:
    """
    Generate comprehensive insights from Part 1B output
    
    Takes the complete Part 1B output and generates insights for the top 3 sections
    using the same persona and job that were used in Part 1B.
    
    Args:
        request: Complete Part 1B output with metadata, extracted_sections, and subsection_analysis
        
    Returns:
        Dict containing all types of insights generated by Gemini
    """
    
    try:
        # Extract persona and job from Part 1B metadata
        metadata = request.metadata
        persona = metadata.get("persona", "Researcher")
        job = metadata.get("job_to_be_done", "Analyze content")
        
        # Get top 3 sections from extracted_sections
        top_3_sections = request.extracted_sections[:3]
        
        if not top_3_sections:
            raise HTTPException(
                status_code=400,
                detail="No sections found in Part 1B output"
            )
        
        # Use the best available content for insights generation
        # Priority: 1) Original PDF sections (if accessible), 2) Enhanced refined text, 3) Fallback to refined text
        sections_for_analysis = []
        
        for section in top_3_sections:
            try:
                # Try to get enhanced content by combining all available information
                enhanced_content = _get_enhanced_section_content(
                    section=section,
                    subsection_analysis=request.subsection_analysis
                )
                
                if enhanced_content:
                    sections_for_analysis.append({
                        "document": section["document"],
                        "page_number": section["page_number"],
                        "section_title": section["section_title"],
                        "content": enhanced_content,
                        "importance_rank": section["importance_rank"],
                        "relevance_score": 1.0 - (section["importance_rank"] - 1) * 0.1
                    })
                    
            except Exception as e:
                print(f"Error processing section from {section['document']}, page {section['page_number']}: {e}")
                # Continue with other sections
        
        if not sections_for_analysis:
            raise HTTPException(
                status_code=400,
                detail="No sections with content found for analysis"
            )
        
        # Initialize Gemini generator
        generator = get_insights_generator()
        
        start_time = time.time()
        
        # Generate all types of insights
        key_insights = generator.generate_key_insights(
            sections=sections_for_analysis,
            persona=persona,
            job=job
        )
        
        did_you_know_facts = generator.generate_did_you_know_facts(
            sections=sections_for_analysis,
            persona=persona
        )
        
        contradictions = generator.find_contradictions_and_connections(
            sections=sections_for_analysis,
            persona=persona
        )
        
        podcast_script = generator.generate_podcast_script(
            sections=sections_for_analysis,
            persona=persona,
            job=job
        )
        
        processing_time = time.time() - start_time
        
        return {
            "status": "success",
            "message": f"Generated insights for {len(sections_for_analysis)} sections from Part 1B analysis",
            "metadata": {
                "persona": persona,
                "job": job,
                "sections_processed": len(sections_for_analysis),
                "processing_time_seconds": round(processing_time, 2),
                "timestamp": datetime.now().isoformat(),
                "source": "Part 1B output"
            },
            "insights": {
                "key_insights": key_insights,
                "did_you_know_facts": did_you_know_facts,
                "contradictions_and_connections": contradictions,
                "podcast_script": podcast_script
            },
            "sections_analyzed": [
                {
                    "title": section["section_title"],
                    "document": section["document"],
                    "page": section["page_number"],
                    "importance_rank": section["importance_rank"],
                    "relevance_score": section["relevance_score"]
                }
                for section in sections_for_analysis
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating insights from Part 1B output: {str(e)}"
        )


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
    request_data: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate insights from already extracted sections (Part 1B output).
    Now includes cross-document analysis using ALL extracted sections from the database.
    
    Args:
        request_data: Part 1B output containing extracted sections and metadata
        
    Returns:
        Dict containing insights generated from the sections
    """
    
    try:
        # Debug: Print received payload
        print("🔍 DEBUG: Received request_data:")
        print(f"   - Keys: {list(request_data.keys())}")
        print(f"   - Metadata: {request_data.get('metadata', {})}")
        print(f"   - Session ID from metadata: {request_data.get('metadata', {}).get('session_id')}")
        
        # Validate input
        if "extracted_sections" not in request_data:
            raise HTTPException(
                status_code=400,
                detail="extracted_sections is required in request data"
            )
        
        # Get the session_id from metadata to fetch ALL sections
        session_id = request_data.get("metadata", {}).get("session_id")
        
        # Generate insights with enhanced cross-document analysis
        insights_generator = GeminiInsightsGenerator()
        
        if session_id:
            # Fetch ALL sections from this session for comprehensive analysis
            print(f"🔍 Fetching all sections for session {session_id} for cross-document analysis...")
            all_sections = _get_all_session_sections(db, session_id)
            print(f"📊 Found {len(all_sections)} total sections for comprehensive analysis")
            
            # Use ALL sections for insights generation, not just the top 3
            enhanced_request_data = request_data.copy()
            enhanced_request_data["all_extracted_sections"] = all_sections
            
            insights_result = insights_generator.generate_comprehensive_insights_with_cross_doc_analysis(
                enhanced_request_data
            )
        else:
            # Fallback to original method if no session_id
            print("⚠️ No session_id found, using limited section analysis")
            insights_result = insights_generator.generate_comprehensive_insights(request_data)
        
        return {
            "insights": insights_result,
            "input_sections_count": len(request_data.get("extracted_sections", [])),
            "total_sections_analyzed": len(all_sections) if session_id else len(request_data.get("extracted_sections", [])),
            "metadata": request_data.get("metadata", {})
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating insights from sections: {str(e)}"
        )


class PodcastRequest(BaseModel):
    sections: List[Dict[str, Any]]
    persona: str = "Researcher"
    job: str = "Analyze content"
    session_id: Optional[int] = None

class TTSRequest(BaseModel):
    podcast_script: Dict[str, Any]
    tts_engine: str = "gtts"  # "gtts" or "pyttsx3"
    voice_settings: Optional[Dict[str, Any]] = None

@router.post("/podcast-only")
async def generate_podcast_only(
    request: PodcastRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Generate only podcast script from sections"""
    
    try:
        # Extract data from request
        sections = request.sections
        persona = request.persona
        job = request.job
        session_id = request.session_id
        
        generator = get_insights_generator()
        
        if session_id:
            # Enhanced cross-document podcast
            print(f"🎧 Generating enhanced podcast with session {session_id}")
            all_sections = _get_all_session_sections(db, session_id)
            
            try:
                # Try to generate cross-doc analysis for enhanced podcast
                from .gemini_generator import GeminiInsightsGenerator
                insights_gen = GeminiInsightsGenerator()
                cross_doc_analysis = insights_gen.find_contradictions_and_connections_enhanced(
                    sections, all_sections, persona
                )
                
                podcast_result = insights_gen.generate_podcast_script_enhanced(
                    sections, cross_doc_analysis, persona, job
                )
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    print(f"⚠️ API quota exceeded, falling back to simple podcast generation")
                    # Fallback to simple podcast without AI enhancement
                    podcast_result = _generate_fallback_podcast_script(sections, persona, job)
                else:
                    raise e
        else:
            # Standard podcast
            print(f"🎧 Generating standard podcast for {len(sections)} sections")
            try:
                podcast_result = generator.generate_podcast_script(sections, persona, job)
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    print(f"⚠️ API quota exceeded, falling back to simple podcast generation")
                    podcast_result = _generate_fallback_podcast_script(sections, persona, job)
                else:
                    raise e
        
        return {
            "podcast_script": podcast_result,
            "sections_analyzed": len(sections),
            "cross_document_enhanced": session_id is not None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating podcast: {str(e)}"
        )


@router.post("/generate-audio")
async def generate_podcast_audio(
    request: TTSRequest
) -> StreamingResponse:
    """Generate audio from podcast script using text-to-speech"""
    
    try:
        print(f"🎵 Generating audio with {request.tts_engine} engine")
        
        # Generate audio bytes
        audio_data = await tts_service.generate_podcast_audio(
            podcast_script=request.podcast_script,
            tts_engine=request.tts_engine,
            voice_settings=request.voice_settings
        )
        
        if not audio_data:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate audio. Please try again with a different engine."
            )
        
        # Create a BytesIO object for streaming
        import io
        audio_stream = io.BytesIO(audio_data)
        
        # Determine media type based on engine
        media_type = "audio/mpeg" if request.tts_engine == "gtts" else "audio/wav"
        
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type=media_type,
            headers={
                "Content-Disposition": "attachment; filename=podcast_audio.mp3" if request.tts_engine == "gtts" else "attachment; filename=podcast_audio.wav",
                "Content-Length": str(len(audio_data))
            }
        )
        
    except Exception as e:
        print(f"❌ Audio generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating audio: {str(e)}"
        )


@router.get("/tts-engines")
async def get_available_tts_engines():
    """Get list of available text-to-speech engines"""
    
    try:
        engines = tts_service.get_available_engines()
        return {
            "available_engines": engines,
            "recommended": "gtts" if engines.get("gtts") else "pyttsx3" if engines.get("pyttsx3") else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking TTS engines: {str(e)}"
        )


@router.post("/key-insights")
async def generate_key_insights_only(
    sections: List[Dict[str, Any]],
    persona: str = "Researcher",
    job: str = "Analyze content"
) -> Dict[str, Any]:
    """Generate only key insights from sections"""
    
    try:
        generator = get_insights_generator()
        return generator.generate_key_insights(sections, persona, job)
        
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
        generator = get_insights_generator()
        return generator.generate_did_you_know_facts(sections, persona)
        
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
        generator = get_insights_generator()
        return generator.find_contradictions_and_connections(sections, persona)
        
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
        generator = get_insights_generator()
        return generator.generate_podcast_script(sections, persona, job, topic)
        
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
        
        # Test if generator can be initialized
        generator = get_insights_generator()
        
        return {
            "status": "healthy",
            "service": "Insights Generation Service",
            "model": "gemini-1.5-flash",
            "api_key_configured": True,
            "primary_endpoint": "/generate-from-part1b"
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
        "description": "Generates AI-powered insights from Part 1B output using Gemini 2.5 Flash",
        "workflow": [
            "1. User runs Part 1B analysis with persona and job",
            "2. Part 1B returns top sections with analysis",
            "3. Frontend calls /insights/generate-from-part1b with Part 1B output",
            "4. Insights uses same persona/job and analyzes top 3 sections",
            "5. Returns personalized insights for the user's specific task"
        ],
        "features": [
            "Key insights extraction tailored to persona and job",
            "Did you know facts generation",
            "Contradiction and connection analysis",
            "Podcast script generation",
            "Seamless Part 1B integration"
        ],
        "primary_endpoint": "/generate-from-part1b",
        "model": "gemini-1.5-flash",
        "input_format": "Complete Part 1B output JSON",
        "input_requirements": {
            "metadata": "Contains persona and job_to_be_done from Part 1B",
            "extracted_sections": "Top sections ranked by importance",
            "subsection_analysis": "Refined text content for each section"
        },
        "output_format": {
            "key_insights": "Actionable insights with relevance scores",
            "did_you_know_facts": "Surprising educational facts",
            "contradictions_and_connections": "Analysis of document relationships",
            "podcast_script": "2-5 minute educational podcast script"
        },
        "example_use_cases": [
            "Traveller planning trip to France → Travel insights for French cities",
            "Student studying chemistry → Key concepts and mechanisms",
            "Researcher analyzing papers → Research methodologies and findings"
        ]
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

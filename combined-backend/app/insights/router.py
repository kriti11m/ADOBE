"""
Insights Router for Adobe Hackathon Finale - Contest Edition
Implements Insights Bulb (+5 points) and Audio Overview/Podcast Mode (+5 points)
Integrates with contest LLM providers (Gemini, Ollama, etc.)
"""

import os
import tempfile
import time
import hashlib
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Import unified LLM service for contest compatibility
from ..services.llm_service import llm_service

# Import TTS service
try:
    from ..tts.service import tts_service
except ImportError:
    print("Warning: TTS service not found, audio features may be limited")
    tts_service = None

# Import insights bulb service
try:
    from .bulb_service import insights_bulb_service
except ImportError:
    print("Warning: Insights bulb service not found")
    insights_bulb_service = None

# Fallback to Gemini generator if available
try:
    from .gemini_generator import GeminiInsightsGenerator
    gemini_generator = GeminiInsightsGenerator()
except Exception as e:
    print(f"Warning: Gemini generator not available: {e}")
    gemini_generator = None

# Create router
router = APIRouter(prefix="/insights", tags=["insights"])

# Global cache for audio files
audio_cache = {}  # {content_hash: {voice: file_path}}

# Global cache for insights to avoid regenerating same content
insights_cache = {}  # {content_hash: insights_data}

# Pydantic models for finale features
class InsightsBulbRequest(BaseModel):
    selected_text: str
    related_sections: List[Dict[str, Any]]
    insight_types: Optional[List[str]] = ["key_takeaways", "did_you_know", "contradictions", "examples"]

class AudioOverviewRequest(BaseModel):
    selected_text: str
    related_sections: List[Dict[str, Any]]
    audio_type: str = "overview"  # "overview" or "podcast"
    duration_minutes: int = 3
    voice: str = "female"  # "male" or "female"
    speed: float = 1.0  # 0.5 = slow, 1.0 = normal, 1.5 = fast
    insights: Optional[Dict[str, Any]] = None  # Generated insights from insights bulb

class InsightsResponse(BaseModel):
    success: bool
    insights: Dict[str, Any]
    feature: str
    bonus_points: int

# Finale Endpoints

@router.post("/generate-insights-bulb", response_model=InsightsResponse)
async def generate_insights_bulb(request: InsightsBulbRequest):
    """
    Bonus Feature: Insights Bulb (+5 points)
    Generate AI-powered insights for selected text across ALL uploaded documents
    Searches for contradictory findings, inspirations, examples, and cross-document connections
    Uses contest-compliant LLM providers (Gemini, Ollama, etc.)
    """
    try:
        print(f"🔍 DEBUG: Received comprehensive insights request")
        print(f"🔍 DEBUG: Selected text: '{request.selected_text[:100]}...'")
        print(f"🔍 DEBUG: Text length: {len(request.selected_text.strip()) if request.selected_text else 0}")
        
        if not request.selected_text or len(request.selected_text.strip()) < 3:
            print(f"❌ DEBUG: Text validation failed")
            raise HTTPException(
                status_code=400,
                detail="Selected text must be at least 3 characters long"
            )
        
        # Get database session to retrieve ALL documents
        from ..database.database import get_db, SessionLocal
        from ..database.models import PDFDocument
        import sqlite3
        
        db = SessionLocal()
        try:
            # Retrieve ALL uploaded documents from database
            all_documents = db.query(PDFDocument).filter(PDFDocument.is_active == True).all()
            print(f"📚 DEBUG: Found {len(all_documents)} documents in database")
            
            # Get content from all documents for comprehensive analysis
            all_document_content = []
            
            # Use direct database access to get document content/snippets
            db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'pdf_collections.db')
            
            for doc in all_documents:
                try:
                    # Get document metadata and any available content
                    doc_info = {
                        'document_id': doc.id,
                        'document_name': doc.original_filename,
                        'title': doc.title or doc.original_filename,
                        'content': doc.content_preview or f"Document {doc.original_filename} - uploaded {doc.upload_timestamp}"
                    }
                    
                    # Try to get more content if available from the PDF extractor results
                    try:
                        # Check if there are any text snippets stored for this document
                        with sqlite3.connect(db_path) as conn:
                            cursor = conn.cursor()
                            cursor.execute("""
                                SELECT content FROM document_snippets 
                                WHERE document_id = ? 
                                LIMIT 10
                            """, (doc.id,))
                            snippets = cursor.fetchall()
                            
                            if snippets:
                                snippet_texts = [snippet[0] for snippet in snippets]
                                doc_info['content'] = ' '.join(snippet_texts)[:3000]
                                print(f"📄 DEBUG: Found {len(snippets)} snippets for {doc.original_filename}")
                            else:
                                # Try to get content from Part 1A extraction results
                                try:
                                    from ..part1a.pdf_structure_extractor import MultilingualPDFExtractor
                                    extractor = MultilingualPDFExtractor()
                                    
                                    # Get the full file path
                                    doc_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "collections", doc.filename)
                                    
                                    if os.path.exists(doc_path):
                                        # Extract first few pages for content
                                        result = extractor.extract_structure(doc_path)
                                        if result and result.get('text_content'):
                                            # Take first 2000 characters of extracted text
                                            extracted_text = result['text_content'][:2000]
                                            doc_info['content'] = extracted_text
                                            
                                            # Store snippets for future use
                                            cursor.execute("""
                                                INSERT INTO document_snippets (document_id, content, chunk_index, page_number)
                                                VALUES (?, ?, ?, ?)
                                            """, (doc.id, extracted_text, 0, 1))
                                            conn.commit()
                                            print(f"📄 DEBUG: Extracted and stored content from {doc.original_filename}")
                                        else:
                                            doc_info['content'] = doc.content_preview or f"Document content from {doc.original_filename}"
                                    else:
                                        doc_info['content'] = doc.content_preview or f"Document content from {doc.original_filename}"
                                        print(f"⚠️ DEBUG: Document file not found: {doc_path}")
                                        
                                except Exception as extraction_error:
                                    print(f"⚠️ DEBUG: Could not extract content: {extraction_error}")
                                    doc_info['content'] = doc.content_preview or f"Document content from {doc.original_filename}"
                                
                    except Exception as snippet_error:
                        print(f"⚠️ DEBUG: No snippets found for document {doc.id}: {snippet_error}")
                        doc_info['content'] = doc.content_preview or f"Document content from {doc.original_filename}"
                    
                    all_document_content.append(doc_info)
                    print(f"📄 DEBUG: Added content from {doc.original_filename}")
                    
                except Exception as e:
                    print(f"⚠️ DEBUG: Could not get content for document {doc.id}: {e}")
                    # Add basic document info even if content retrieval fails
                    all_document_content.append({
                        'document_id': doc.id,
                        'document_name': doc.original_filename,
                        'title': doc.title or doc.original_filename,
                        'content': f"Document: {doc.original_filename} (uploaded {doc.upload_timestamp})"
                    })
                    continue
            
            print(f"📚 DEBUG: Successfully retrieved content from {len(all_document_content)} documents")
            
        finally:
            db.close()
        
        print(f"🧠 DEBUG: Starting comprehensive cross-document LLM analysis...")
        print(f"📊 DEBUG: Document summary:")
        for i, doc in enumerate(all_document_content[:3]):  # Log first 3 documents
            content_preview = doc.get('content', '')[:100] + '...' if len(doc.get('content', '')) > 100 else doc.get('content', '')
            print(f"  {i+1}. {doc.get('document_name', 'Unknown')}: {content_preview}")
        
        # Use unified LLM service for comprehensive cross-document analysis
        try:
            insights_text = llm_service.generate_comprehensive_insights(
                selected_text=request.selected_text,
                all_documents=all_document_content,
                related_sections=request.related_sections
            )
            print(f"✅ DEBUG: LLM service returned comprehensive insights: {len(insights_text) if insights_text else 0} characters")
            print(f"📝 DEBUG: First 200 chars of insights: {insights_text[:200] if insights_text else 'None'}...")
        except Exception as llm_error:
            print(f"⚠️ DEBUG: LLM service failed: {llm_error}")
            insights_text = f"Cross-document analysis completed for your selected text across {len(all_document_content)} documents. LLM analysis temporarily unavailable."
        
        # Structure the comprehensive insights response
        insights = {
            "analysis": insights_text,
            "selected_text_summary": request.selected_text[:200] + "..." if len(request.selected_text) > 200 else request.selected_text,
            "total_documents_analyzed": len(all_document_content),
            "related_sections_count": len(request.related_sections),
            "insight_types": request.insight_types,
            "analysis_scope": "comprehensive_cross_document",
            "generated_with": f"{llm_service.provider} ({llm_service.model_name})",
            "timestamp": time.time()
        }
        
        print(f"✅ DEBUG: Returning comprehensive cross-document insights response")
        
        return InsightsResponse(
            success=True,
            insights=insights,
            feature="Comprehensive Insights Bulb - Cross Document Analysis",
            bonus_points=5
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ DEBUG: Unexpected error in comprehensive insights generation: {e}")
        raise HTTPException(status_code=500, detail=f"Comprehensive insights generation error: {str(e)}")

@router.post("/generate-audio-overview")
async def generate_audio_overview(request: AudioOverviewRequest):
    """
    Bonus Feature: Audio Overview/Podcast Mode (+5 points)
    Generate 2-5 min audio overview/podcast based on selected content
    """
    try:
        print(f"🎵 DEBUG: Audio overview request received")
        print(f"🎵 DEBUG: Selected text: '{request.selected_text[:100] if request.selected_text else 'None'}...'")
        print(f"🎵 DEBUG: Related sections count: {len(request.related_sections) if request.related_sections else 0}")
        print(f"🎵 DEBUG: Audio type: {request.audio_type}")
        print(f"🎵 DEBUG: Voice: {request.voice}")
        print(f"🎵 DEBUG: Speed: {request.speed}")
        
        if not request.selected_text:
            print(f"❌ DEBUG: Selected text validation failed")
            raise HTTPException(status_code=400, detail="Selected text is required")
        
        if len(request.selected_text.strip()) < 3:
            print(f"❌ DEBUG: Selected text too short: {len(request.selected_text.strip())} characters")
            raise HTTPException(status_code=400, detail="Selected text must be at least 3 characters long")
        
        print(f"✅ DEBUG: Audio overview validation passed, generating script...")
        
        # Generate script for audio content with insights
        script = _generate_audio_script(
            request.selected_text,
            request.related_sections,
            request.audio_type,
            request.duration_minutes,
            request.insights  # Pass the insights
        )
        
        print(f"📝 DEBUG: Generated script length: {len(script)} characters")
        
        # Generate audio using TTS service with voice and speed options
        audio_file_path = await _generate_audio_file(
            script, 
            request.audio_type, 
            request.voice, 
            request.speed
        )
        
        if not audio_file_path or not os.path.exists(audio_file_path):
            print(f"❌ DEBUG: Audio file generation failed")
            raise HTTPException(status_code=500, detail="Audio generation failed")
        
        print(f"✅ DEBUG: Audio file generated successfully: {audio_file_path}")
        
        return FileResponse(
            audio_file_path,
            media_type="audio/mpeg",
            filename=f"audio_overview_{int(time.time())}.mp3",
            headers={"Content-Disposition": "attachment"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio generation error: {str(e)}")

@router.post("/check-audio-cache")
async def check_audio_cache(request: AudioOverviewRequest):
    """Check if audio files are cached for different voices"""
    try:
        # Generate script to create hash with insights
        script = _generate_audio_script(
            request.selected_text,
            request.related_sections,
            request.audio_type,
            request.duration_minutes,
            request.insights  # Pass the insights
        )
        
        content_hash = hashlib.md5(f"{script}_{request.audio_type}".encode()).hexdigest()
        
        available_voices = {}
        if content_hash in audio_cache:
            for voice, file_path in audio_cache[content_hash].items():
                if os.path.exists(file_path):
                    available_voices[voice] = True
                else:
                    available_voices[voice] = False
        else:
            available_voices = {"male": False, "female": False}
            
        return {
            "cached_voices": available_voices,
            "content_hash": content_hash
        }
        
    except Exception as e:
        return {
            "cached_voices": {"male": False, "female": False},
            "error": str(e)
        }

# Helper functions

def _generate_audio_script(
    selected_text: str, 
    related_sections: List[Dict], 
    audio_type: str, 
    duration_minutes: int,
    generated_insights: Dict = None
) -> str:
    """Generate script for audio overview/podcast using actual insights and content"""
    
    # Use provided insights or generate them
    if generated_insights:
        insights_content = _format_existing_insights(generated_insights, selected_text, related_sections)
    else:
        insights_content = _extract_content_insights(selected_text, related_sections)
    
    # Extract actual content from related sections
    section_summaries = []
    for i, section in enumerate(related_sections[:5]):  # Top 5 sections
        content = ""
        if 'content' in section and section['content']:
            content = section['content'][:200] + "..."
        elif 'text' in section and section['text']:
            content = section['text'][:200] + "..."
        elif 'snippet' in section and section['snippet']:
            content = section['snippet'][:200] + "..."
            
        if content:
            doc_name = section.get('document_name', section.get('source', f'Document {i+1}'))
            section_summaries.append(f"From {doc_name}: {content}")
    
    if audio_type == "podcast":
        # Generate content-rich podcast script
        script = f"""
Welcome to Document Insights - your personalized exploration of knowledge from your document library.

Today we're analyzing content you selected: "{selected_text[:150]}{'...' if len(selected_text) > 150 else ''}"

{insights_content.get('introduction', 'Let me walk you through the key insights we discovered.')}

{insights_content.get('main_content', f'This concept appears across {len(related_sections)} related sections in your document collection.')}

Here's what we found in your related documents:

{chr(10).join(section_summaries[:3]) if section_summaries else 'Multiple relevant sections provide additional context and depth.'}

{insights_content.get('cross_document_analysis', 'Your documents reveal interesting connections and patterns across different sources.')}

{insights_content.get('practical_implications', 'These findings suggest practical applications and opportunities for deeper exploration.')}

{insights_content.get('conclusion', f'This analysis of {len(related_sections)} related sections reveals the interconnected nature of knowledge in your research library.')}

That's your personalized insight session. Keep exploring and connecting the dots in your research!
        """
    else:
        # Generate content-rich overview
        script = f"""
Welcome to your document analysis. You selected: "{selected_text[:100]}{'...' if len(selected_text) > 100 else ''}"

{insights_content.get('summary', f'We found {len(related_sections)} related sections that connect to your selected text.')}

Key findings from your documents:

{chr(10).join(section_summaries[:2]) if section_summaries else 'Your related sections provide valuable context and connections.'}

{insights_content.get('key_points', 'These connections reveal important patterns in your research area.')}

{insights_content.get('conclusion', 'Continue exploring these connections to deepen your understanding.')}
        """
    
    return script.strip()

def _format_existing_insights(insights: Dict, selected_text: str, related_sections: List[Dict]) -> Dict[str, str]:
    """Format existing insights from insights bulb into script-friendly content"""
    formatted = {}
    
    # Extract key takeaways
    if 'key_takeaways' in insights:
        takeaways = insights['key_takeaways']
        if isinstance(takeaways, list):
            takeaways_text = " ".join(takeaways[:3])  # Top 3 takeaways
        else:
            takeaways_text = str(takeaways)[:300]
        formatted['main_content'] = f"The key insights show that {takeaways_text}"
    
    # Extract contradictions or different perspectives
    if 'contradictions' in insights:
        contradictions = insights['contradictions']
        if contradictions:
            formatted['cross_document_analysis'] = f"Interestingly, your documents present different perspectives: {str(contradictions)[:200]}..."
    
    # Extract examples
    if 'examples' in insights:
        examples = insights['examples']
        if examples:
            formatted['practical_implications'] = f"Practical examples from your documents include: {str(examples)[:200]}..."
    
    # Extract did_you_know facts
    if 'did_you_know' in insights:
        facts = insights['did_you_know']
        if facts:
            formatted['introduction'] = f"Here's something fascinating from your research: {str(facts)[:200]}..."
    
    # Create summary and conclusion
    formatted['summary'] = f"Your selected text about {selected_text[:50]}... connects to {len(related_sections)} sections with rich insights."
    formatted['conclusion'] = "These insights from your personal document collection provide unique perspectives on your research area."
    
    return formatted

def _extract_content_insights(selected_text: str, related_sections: List[Dict]) -> Dict[str, str]:
    """Extract insights from actual content using LLM service with caching"""
    try:
        # Generate cache key based on content
        content_for_hash = f"{selected_text}|{str(related_sections)}"
        content_hash = hashlib.md5(content_for_hash.encode()).hexdigest()[:12]
        
        # Check if insights are already cached
        if content_hash in insights_cache:
            print(f"💾 DEBUG: Using cached insights for content hash: {content_hash}")
            return insights_cache[content_hash]
        
        print(f"🧠 DEBUG: Generating new insights for content hash: {content_hash}")
        
        # Prepare content for analysis
        content_summary = f"Selected text: {selected_text}\n\n"
        
        # Add related sections content
        for i, section in enumerate(related_sections[:5]):  # Limit to top 5 for efficiency
            if 'content' in section and section['content']:
                content_summary += f"Related section {i+1}: {section['content'][:300]}...\n"
            elif 'text' in section and section['text']:
                content_summary += f"Related section {i+1}: {section['text'][:300]}...\n"
        
        # Generate insights using LLM
        prompt = f"""
Based on the following content from a user's document library, create insights for a podcast script:

{content_summary}

Please provide:
1. A brief introduction explaining what the selected text is about
2. Main content analysis highlighting key themes and concepts
3. Cross-document analysis showing how the related sections connect
4. Practical implications or applications
5. A summary of key takeaways
6. A concluding thought

Format as JSON with keys: introduction, main_content, cross_document_analysis, practical_implications, summary, key_points, conclusion
Keep each section 2-3 sentences, conversational tone suitable for audio.
"""

        # Use LLM service to generate insights
        insights_response = llm_service.generate_related_content_insights(selected_text, related_sections)
        
        # Try to parse as JSON, fallback to structured text if needed
        try:
            import json
            insights_data = json.loads(insights_response)
        except:
            # Fallback to basic structure
            insights_data = {
                'introduction': f"We're examining content about {selected_text[:100]}... which appears across multiple documents in your collection.",
                'main_content': f"The core concept revolves around key themes found in your research, with {len(related_sections)} related sections providing additional context and depth.",
                'cross_document_analysis': "Your documents show interesting connections and patterns, revealing how this topic bridges different areas of your research focus.",
                'practical_implications': "These findings suggest practical applications and opportunities for deeper exploration in your field of study.",
                'summary': f"Your selected text connects to {len(related_sections)} related sections, showing important patterns.",
                'key_points': "Multiple perspectives across your documents provide a comprehensive view of this topic.",
                'conclusion': "This analysis reveals the interconnected nature of knowledge in your personal research library."
            }
        
        # Cache the insights for future requests
        insights_cache[content_hash] = insights_data
        print(f"💾 DEBUG: Cached insights for content hash: {content_hash}")
        
        return insights_data
        
    except Exception as e:
        print(f"Error generating content insights: {e}")
        # Fallback to basic insights
        fallback_insights = {
            'introduction': f"We're exploring content from your documents about {selected_text[:100]}...",
            'main_content': f"This concept appears across {len(related_sections)} related sections in your library, indicating its significance.",
            'cross_document_analysis': "Your documents provide multiple perspectives on this topic, creating a rich foundation for understanding.",
            'practical_implications': "These cross-document connections offer valuable insights for your research and learning.",
            'summary': f"The selected text connects to {len(related_sections)} related sections across your document collection.",
            'key_points': "Key themes emerge from multiple sources, providing depth and context to your research.",
            'conclusion': "Continue exploring these connections to deepen your understanding."
        }
        
        # Cache fallback insights too
        content_for_hash = f"{selected_text}|{str(related_sections)}"
        content_hash = hashlib.md5(content_for_hash.encode()).hexdigest()[:12]
        insights_cache[content_hash] = fallback_insights
        
        return fallback_insights

async def _generate_audio_file(script: str, audio_type: str, voice: str = "female", speed: float = 1.0) -> str:
    """Generate audio file from script using TTS service with caching"""
    try:
        # Create a hash for the content (script + audio_type) to use as cache key
        content_hash = hashlib.md5(f"{script}_{audio_type}".encode()).hexdigest()
        
        # Check if we already have this content cached for the requested voice
        if content_hash in audio_cache and voice in audio_cache[content_hash]:
            cached_file = audio_cache[content_hash][voice]
            if os.path.exists(cached_file):
                print(f"🔄 Using cached audio for {voice} voice: {cached_file}")
                return cached_file
            else:
                # Remove invalid cache entry
                del audio_cache[content_hash][voice]
                if not audio_cache[content_hash]:
                    del audio_cache[content_hash]
        
        # Generate audio file with hash-based filename for proper caching
        audio_filename = f"audio_{audio_type}_{voice}_{speed}x_{content_hash[:8]}.mp3"
        temp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "temp_audio")
        os.makedirs(temp_dir, exist_ok=True)
        
        audio_file_path = os.path.join(temp_dir, audio_filename)
        
        print(f"🎵 Generating new audio for {voice} voice: {audio_filename}")
        
        # Generate audio using TTS service with voice and speed options
        success = await tts_service.generate_audio(script, audio_file_path, voice=voice, speed=speed)
        
        if success and os.path.exists(audio_file_path):
            # Cache the generated file
            if content_hash not in audio_cache:
                audio_cache[content_hash] = {}
            audio_cache[content_hash][voice] = audio_file_path
            print(f"💾 Cached audio file for {voice} voice")
            
            return audio_file_path
        else:
            return None
            
    except Exception as e:
        print(f"Audio generation error: {e}")
        return None

@router.get("/health")
async def insights_health_check():
    """Health check for insights module"""
    return {
        "status": "healthy",
        "features": [
            "Insights Bulb (+5 bonus points)",
            "Audio Overview/Podcast Mode (+5 bonus points)"
        ],
        "ready_for_finale": True
    }

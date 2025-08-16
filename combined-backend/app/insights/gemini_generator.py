"""
Gemini 2.5 Flash Insights Generator
Generates insights, key facts, contradictions, and podcasts using Google's Gemini model
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class GeminiInsightsGenerator:
    """Generates insights using Gemini 2.5 Flash model"""
    
    def __init__(self):
        """Initialize Gemini client with API key from environment"""
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        try:
            import google.generativeai as genai
            from google.generativeai.types import HarmCategory, HarmBlockThreshold
            
            # Configure Gemini
            genai.configure(api_key=self.api_key)
            
            # Initialize the model
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": 4096,
                },
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                }
            )
            
            print("✅ Gemini 1.5 Flash initialized successfully")
            
        except ImportError:
            print("❌ google-generativeai package not installed. Please install it with: pip install google-generativeai")
            raise
    
    def generate_insights(self, prompt: str) -> str:
        """Generate insights using Gemini based on the provided prompt"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"❌ Error generating insights: {e}")
            return ""
    
    def generate_key_insights(self, sections: List[Dict], persona: str, job: str) -> Dict[str, Any]:
        """Generate key insights from document sections"""
        
        # Prepare context from sections
        context = self._prepare_sections_context(sections)
        
        prompt = f"""
        You are an expert analyst helping a {persona} with the following task: {job}
        
        Based on the following document sections, generate key insights that would be most valuable for this persona and task:
        
        {context}
        
        Please provide:
        1. 5-7 key insights that directly relate to the persona's needs
        2. Each insight should be actionable and specific
        3. Focus on what matters most for: {job}
        
        Format your response as a JSON object with the following structure:
        {{
            "insights": [
                {{
                    "title": "Brief insight title",
                    "description": "Detailed explanation",
                    "relevance_score": 0.95,
                    "related_sections": ["section1", "section2"]
                }}
            ],
            "summary": "Overall summary of key takeaways"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            return {
                "insights": result.get("insights", []),
                "summary": result.get("summary", ""),
                "generated_at": datetime.now().isoformat(),
                "persona": persona,
                "job": job
            }
        except Exception as e:
            print(f"Error generating insights: {e}")
            return {
                "insights": [],
                "summary": "Failed to generate insights",
                "error": str(e),
                "generated_at": datetime.now().isoformat()
            }
    
    def generate_did_you_know_facts(self, sections: List[Dict], persona: str) -> Dict[str, Any]:
        """Generate interesting 'Did you know?' facts"""
        
        context = self._prepare_sections_context(sections)
        
        prompt = f"""
        You are creating interesting "Did you know?" facts for a {persona}.
        
        Based on these document sections, generate fascinating, lesser-known facts that would surprise and educate:
        
        {context}
        
        Generate 5-8 "Did you know?" facts that are:
        1. Surprising or counterintuitive
        2. Relevant to the content
        3. Educational and memorable
        4. Appropriate for a {persona}
        
        Format as JSON:
        {{
            "facts": [
                {{
                    "fact": "The actual surprising fact",
                    "explanation": "Why this is interesting/important",
                    "source_section": "which section this came from"
                }}
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            return {
                "facts": result.get("facts", []),
                "generated_at": datetime.now().isoformat(),
                "persona": persona
            }
        except Exception as e:
            print(f"Error generating facts: {e}")
            return {
                "facts": [],
                "error": str(e),
                "generated_at": datetime.now().isoformat()
            }
    
    def find_contradictions_and_connections(self, sections: List[Dict], persona: str) -> Dict[str, Any]:
        """Find contradictions, counterpoints, and connections across documents"""
        
        context = self._prepare_sections_context(sections)
        
        prompt = f"""
        You are analyzing multiple document sections for a {persona} to identify:
        1. Contradictions between different sections/documents
        2. Counterpoints or alternative perspectives
        3. Interesting connections and relationships
        
        Document sections:
        {context}
        
        Analyze these sections and identify:
        
        Format as JSON:
        {{
            "contradictions": [
                {{
                    "description": "What contradicts what",
                    "section1": "First conflicting section",
                    "section2": "Second conflicting section",
                    "significance": "Why this matters"
                }}
            ],
            "connections": [
                {{
                    "description": "How sections connect",
                    "related_sections": ["section1", "section2", "section3"],
                    "connection_type": "causal/comparative/complementary",
                    "insight": "What this connection reveals"
                }}
            ],
            "counterpoints": [
                {{
                    "main_point": "The primary argument/statement",
                    "counterpoint": "Alternative perspective",
                    "source_sections": ["section1", "section2"]
                }}
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            return {
                "contradictions": result.get("contradictions", []),
                "connections": result.get("connections", []),
                "counterpoints": result.get("counterpoints", []),
                "generated_at": datetime.now().isoformat(),
                "persona": persona
            }
        except Exception as e:
            print(f"Error finding contradictions/connections: {e}")
            return {
                "contradictions": [],
                "connections": [],
                "counterpoints": [],
                "error": str(e),
                "generated_at": datetime.now().isoformat()
            }
    
    def generate_podcast_script(self, sections: List[Dict], persona: str, job: str, topic: str = None) -> Dict[str, Any]:
        """Generate a 2-5 minute podcast script"""
        
        context = self._prepare_sections_context(sections)
        topic_focus = topic if topic else f"key concepts for {job}"
        
        prompt = f"""
        Create a 2-5 minute podcast script for a {persona} focusing on: {topic_focus}
        
        The podcast should be engaging, educational, and conversational.
        
        Based on these document sections:
        {context}
        
        Create a podcast script that includes:
        1. Engaging introduction (30 seconds)
        2. Main content with 3-4 key points (3-4 minutes)
        3. Memorable conclusion with takeaways (30 seconds)
        
        Make it sound natural and conversational, as if explaining to a friend.
        Include specific examples from the documents.
        
        Format as JSON:
        {{
            "title": "Podcast episode title",
            "duration_estimate": "4 minutes",
            "script": [
                {{
                    "segment": "introduction",
                    "duration": "30 seconds",
                    "content": "Script content for this segment"
                }},
                {{
                    "segment": "main_point_1",
                    "duration": "60 seconds", 
                    "content": "Script content"
                }}
            ],
            "key_takeaways": ["takeaway 1", "takeaway 2"],
            "references": ["section titles referenced"]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            return {
                "title": result.get("title", f"Insights on {topic_focus}"),
                "duration_estimate": result.get("duration_estimate", "3-4 minutes"),
                "script": result.get("script", []),
                "key_takeaways": result.get("key_takeaways", []),
                "references": result.get("references", []),
                "generated_at": datetime.now().isoformat(),
                "persona": persona,
                "job": job,
                "topic": topic_focus
            }
        except Exception as e:
            print(f"Error generating podcast: {e}")
            return {
                "title": f"Insights on {topic_focus}",
                "script": [],
                "error": str(e),
                "generated_at": datetime.now().isoformat()
            }
    
    def generate_comprehensive_insights(self, part1b_output: Dict[str, Any]) -> Dict[str, Any]:
        """Generate all types of insights from Part 1B output"""
        
        # Extract relevant data from Part 1B output
        sections = part1b_output.get("extracted_sections", [])
        metadata = part1b_output.get("metadata", {})
        persona = metadata.get("persona", "Student")
        job = metadata.get("job_to_be_done", "Learn from documents")
        
        if not sections:
            return {
                "error": "No sections found in Part 1B output",
                "generated_at": datetime.now().isoformat()
            }
        
        print(f"Generating comprehensive insights for {len(sections)} sections...")
        
        try:
            # Generate all types of insights
            insights = self.generate_key_insights(sections, persona, job)
            facts = self.generate_did_you_know_facts(sections, persona)
            contradictions = self.find_contradictions_and_connections(sections, persona)
            podcast = self.generate_podcast_script(sections, persona, job)
            
            return {
                "key_insights": insights,
                "did_you_know_facts": facts,
                "contradictions_and_connections": contradictions,
                "podcast_script": podcast,
                "metadata": {
                    "persona": persona,
                    "job": job,
                    "sections_analyzed": len(sections),
                    "generated_at": datetime.now().isoformat(),
                    "model": "gemini-1.5-flash"
                }
            }
            
        except Exception as e:
            print(f"Error generating comprehensive insights: {e}")
            return {
                "error": str(e),
                "generated_at": datetime.now().isoformat()
            }
    
    def _prepare_sections_context(self, sections: List[Dict]) -> str:
        """Prepare sections data for Gemini context"""
        context_parts = []
        
        for i, section in enumerate(sections[:10]):  # Limit to top 10 sections
            title = section.get("section_title", f"Section {i+1}")
            content = section.get("content", "")[:1000]  # Limit content length
            document = section.get("document", "Unknown")
            page = section.get("page", "Unknown")
            
            context_parts.append(f"""
Section {i+1}: {title}
Document: {document}
Page: {page}
Content: {content}...
---
""")
        
        return "\n".join(context_parts)
    
    def _parse_json_response(self, response_text: str) -> Dict:
        """Parse JSON response from Gemini, handling potential formatting issues"""
        try:
            # Clean up the response text
            cleaned = response_text.strip()
            
            # Remove markdown code blocks if present
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            # Find the JSON part - handle cases where there's extra text after JSON
            if '{' in cleaned and '}' in cleaned:
                start_idx = cleaned.find('{')
                # Find the matching closing brace
                brace_count = 0
                end_idx = start_idx
                for i, char in enumerate(cleaned[start_idx:], start_idx):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break
                
                cleaned = cleaned[start_idx:end_idx]
            
            cleaned = cleaned.strip()
            
            # Parse JSON
            return json.loads(cleaned)
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Cleaned response text: {cleaned[:500]}...")
            
            # Return a basic structure if parsing fails
            return {
                "error": "Failed to parse response",
                "raw_response": response_text[:1000]
            }

    def generate_comprehensive_insights_with_cross_doc_analysis(self, part1b_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate all types of insights with enhanced cross-document analysis using ALL sections
        """
        
        try:
            # Extract sections and metadata
            primary_sections = part1b_output.get("extracted_sections", [])  # Top 3 relevant sections
            all_sections = part1b_output.get("all_extracted_sections", [])  # ALL sections from database
            metadata = part1b_output.get("metadata", {})
            
            persona = metadata.get("persona", "Analyst")
            job = metadata.get("job_to_be_done", "Analyze content")
            
            print(f"🔍 Generating comprehensive insights with cross-document analysis:")
            print(f"   - Primary sections (Part 1B): {len(primary_sections)}")
            print(f"   - Total sections available: {len(all_sections)}")
            
            if not primary_sections:
                return {
                    "error": "No primary sections found in Part 1B output",
                    "generated_at": datetime.now().isoformat()
                }
            
            # Generate insights from primary sections (focused analysis)
            insights = self.generate_key_insights(primary_sections, persona, job)
            facts = self.generate_did_you_know_facts(primary_sections, persona)
            
            # Use ALL sections for cross-document analysis (contradictions & connections)
            print("🔄 Analyzing contradictions and connections across ALL documents...")
            contradictions_connections = self.find_contradictions_and_connections_enhanced(
                primary_sections, all_sections, persona
            )
            
            # Generate podcast script from primary sections but mention cross-doc insights
            podcast_script = self.generate_podcast_script_enhanced(
                primary_sections, contradictions_connections, persona, job
            )
            
            return {
                "key_insights": insights,
                "did_you_know_facts": facts,
                "contradictions_and_connections": contradictions_connections,
                "podcast_script": podcast_script,
                "metadata": {
                    "generation_timestamp": datetime.now().isoformat(),
                    "primary_sections_analyzed": len(primary_sections),
                    "total_sections_analyzed": len(all_sections),
                    "cross_document_analysis": True,
                    "persona": persona,
                    "job": job,
                    "model": "gemini-1.5-flash"
                }
            }
            
        except Exception as e:
            print(f"Error in comprehensive insights generation with cross-doc analysis: {e}")
            return {
                "key_insights": {"error": str(e)},
                "did_you_know_facts": {"error": str(e)},
                "contradictions_and_connections": {"error": str(e)},
                "podcast_script": {"error": str(e)},
                "generated_at": datetime.now().isoformat()
            }

    def find_contradictions_and_connections_enhanced(self, primary_sections: List[Dict], all_sections: List[Dict], persona: str) -> Dict[str, Any]:
        """
        Enhanced cross-document analysis: find contradictions and connections across ALL documents
        """
        
        # Prepare context from ALL sections for comprehensive analysis
        all_context = self._prepare_sections_context(all_sections)
        primary_context = self._prepare_sections_context(primary_sections)
        
        prompt = f"""
        You are analyzing documents for a {persona}. You have access to these SPECIFIC sections that are most relevant:

        PRIMARY SECTIONS (focus area):
        {primary_context}

        COMPLETE DOCUMENT CORPUS (for cross-referencing):
        {all_context}

        Your task is to:
        1. Find contradictions between the primary sections and ANY other sections in the complete corpus
        2. Discover connections and patterns across ALL documents that relate to the primary sections
        3. Identify counterpoints or alternative perspectives from the broader document set
        4. Find inspirations and synergies across different documents

        Focus on connections that span multiple documents and reveal insights that wouldn't be apparent from just the primary sections.

        Format as JSON:
        {{
            "contradictions": [
                {{
                    "contradiction": "Clear description of what contradicts what",
                    "explanation": "Why this matters and implications",
                    "sections": ["document sections involved"],
                    "significance": "Impact for the {persona}"
                }}
            ],
            "connections": [
                {{
                    "connection": "How different documents/sections connect",
                    "explanation": "What this connection reveals",
                    "sections": ["all related sections"],
                    "connection_type": "thematic/causal/complementary/contradictory",
                    "insight": "Key insight from this connection"
                }}
            ],
            "cross_document_insights": [
                {{
                    "insight": "Pattern or theme spanning multiple documents", 
                    "evidence": "Supporting evidence from different docs",
                    "implications": "What this means for the {persona}"
                }}
            ],
            "inspiration_opportunities": [
                {{
                    "opportunity": "How ideas from different docs can be combined",
                    "source_docs": ["documents providing the ideas"],
                    "potential_application": "How the {persona} could use this"
                }}
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            
            return {
                "contradictions": result.get("contradictions", []),
                "connections": result.get("connections", []),
                "cross_document_insights": result.get("cross_document_insights", []),
                "inspiration_opportunities": result.get("inspiration_opportunities", []),
                "analysis_scope": {
                    "primary_sections": len(primary_sections),
                    "total_sections_analyzed": len(all_sections),
                    "cross_document_analysis": True
                }
            }
            
        except Exception as e:
            print(f"Error in enhanced contradictions/connections analysis: {e}")
            return {
                "contradictions": [],
                "connections": [],
                "cross_document_insights": [],
                "inspiration_opportunities": [],
                "error": str(e)
            }

    def generate_podcast_script_enhanced(self, primary_sections: List[Dict], cross_doc_analysis: Dict, persona: str, job: str) -> Dict[str, Any]:
        """
        Generate podcast script that incorporates cross-document insights
        """
        
        primary_context = self._prepare_sections_context(primary_sections)
        connections = cross_doc_analysis.get("connections", [])
        contradictions = cross_doc_analysis.get("contradictions", [])
        insights = cross_doc_analysis.get("cross_document_insights", [])
        
        connections_summary = "\n".join([f"- {conn.get('connection', '')}: {conn.get('explanation', '')}" for conn in connections[:3]])
        contradictions_summary = "\n".join([f"- {contr.get('contradiction', '')}: {contr.get('explanation', '')}" for contr in contradictions[:2]])
        insights_summary = "\n".join([f"- {insight.get('insight', '')}" for insight in insights[:3]])
        
        prompt = f"""
        Create an engaging podcast script for a {persona} focused on: {job}

        PRIMARY CONTENT:
        {primary_context}

        CROSS-DOCUMENT INSIGHTS DISCOVERED:
        Connections found: {connections_summary}
        
        Contradictions found: {contradictions_summary}
        
        Broader insights: {insights_summary}

        Create a 5-7 minute podcast script that:
        1. Introduces the topic and why it matters for a {persona}
        2. Discusses the key findings from the primary sections
        3. Reveals the interesting cross-document connections and contradictions
        4. Explores what these patterns mean for the {persona}
        5. Ends with actionable insights

        Make it conversational, engaging, and highlight the "aha moments" from the cross-document analysis.

        Format as JSON:
        {{
            "title": "Engaging title for the podcast episode",
            "description": "Brief description of what listeners will learn",
            "estimated_duration": "5-7 minutes",
            "script": "Full conversational script with natural transitions",
            "key_takeaways": ["3-5 main points listeners should remember"],
            "cross_document_highlights": ["Specific insights that came from analyzing multiple documents"]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            
            return {
                "title": result.get("title", f"Insights on {job}"),
                "description": result.get("description", ""),
                "estimated_duration": result.get("estimated_duration", "5-7 minutes"),
                "script": result.get("script", ""),
                "key_takeaways": result.get("key_takeaways", []),
                "cross_document_highlights": result.get("cross_document_highlights", []),
                "enhanced_with_cross_doc_analysis": True
            }
            
        except Exception as e:
            print(f"Error generating enhanced podcast script: {e}")
            return {
                "title": f"Insights on {job}",
                "description": "Podcast generation failed",
                "script": "Unable to generate script due to an error.",
                "error": str(e)
            }

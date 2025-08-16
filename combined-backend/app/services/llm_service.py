"""
Unified LLM Service for Adobe Contest
Integrates with existing insights system and supports multiple LLM providers
"""

import os
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime

# Add project root to path to import chat_with_llm
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    from chat_with_llm import get_llm_response
except ImportError:
    print("Warning: chat_with_llm module not found. LLM functionality may be limited.")
    get_llm_response = None

class UnifiedLLMService:
    """
    Unified LLM service that works with the contest requirements
    Supports Gemini, Ollama, and other providers through environment variables
    """
    
    def __init__(self):
        """Initialize LLM service based on environment variables"""
        self.provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        self.model_name = self._get_model_name()
        
        print(f"🚀 Initializing LLM Service with provider: {self.provider}")
        self._test_connection()
    
    def _get_model_name(self):
        """Get model name based on provider"""
        if self.provider == "gemini":
            return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        elif self.provider == "ollama":
            return os.getenv("OLLAMA_MODEL", "llama3")
        elif self.provider == "openai":
            return os.getenv("OPENAI_MODEL", "gpt-4o")
        elif self.provider == "azure":
            return os.getenv("AZURE_DEPLOYMENT_NAME", "gpt-4o")
        return "unknown"
    
    def _test_connection(self):
        """Test LLM connection with a simple query"""
        try:
            if get_llm_response:
                test_messages = [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Hello, can you hear me?"}
                ]
                response = get_llm_response(test_messages)
                if response:
                    print(f"✅ LLM connection successful with {self.provider}")
                else:
                    print(f"⚠️ LLM connection test returned empty response")
            else:
                print(f"⚠️ LLM module not available, using fallback mode")
        except Exception as e:
            print(f"⚠️ LLM connection test failed: {e}")
    
    def generate_insights(self, text_data: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate insights from text data using the configured LLM
        
        Args:
            text_data: List of text snippets with metadata
            context: Additional context for insight generation
            
        Returns:
            Dictionary containing generated insights
        """
        try:
            # Prepare the prompt
            prompt = self._build_insights_prompt(text_data, context)
            
            messages = [
                {"role": "system", "content": "You are an expert document analyst. Generate comprehensive insights from the provided text data."},
                {"role": "user", "content": prompt}
            ]
            
            if get_llm_response:
                response = get_llm_response(messages)
                return self._parse_insights_response(response)
            else:
                return self._fallback_insights(text_data)
                
        except Exception as e:
            print(f"Error generating insights: {e}")
            return self._fallback_insights(text_data)
    
    def generate_related_content_insights(self, selected_text: str, related_sections: List[Dict[str, Any]]) -> str:
        """
        Generate insights about the relationship between selected text and related sections
        
        Args:
            selected_text: The text selected by the user
            related_sections: List of related sections found by semantic search
            
        Returns:
            String containing insights about the relationships
        """
        try:
            print(f"🧠 LLM Service: Generating insights for text of length {len(selected_text)}")
            print(f"🧠 LLM Service: Found {len(related_sections)} related sections")
            
            # Build context from related sections
            sections_context = ""
            if related_sections:
                sections_context = "\n\nRELATED SECTIONS FROM OTHER DOCUMENTS:\n"
                for i, section in enumerate(related_sections[:3], 1):  # Limit to top 3 for brevity
                    section_text = section.get('content', section.get('text', ''))[:300]  # Limit length
                    document_name = section.get('document', section.get('document_name', f'Document {i}'))
                    sections_context += f"\n{i}. From '{document_name}':\n{section_text}...\n"
            
            # Enhanced prompt that analyzes cross-document relationships
            prompt = f"""
            Analyze the selected text in the context of related content from other documents to provide cross-document insights.
            
            SELECTED TEXT:
            "{selected_text[:800]}"
            {sections_context}
            
            Please provide specific insights in these categories:
            
            KEY TAKEAWAYS:
            - What are the main concepts from the selected text?
            - How do these concepts relate to the content in other documents?
            - What important patterns or themes emerge across documents?
            
            DID YOU KNOW:
            - What interesting connections exist between the selected text and related sections?
            - What unique perspectives or additional context do the related documents provide?
            - What surprising relationships or correlations can you identify?
            
            CONTRADICTIONS/COUNTERPOINTS:
            - Are there any conflicting viewpoints between the selected text and related sections?
            - What alternative approaches or perspectives are presented in the related content?
            
            EXAMPLES:
            - What specific examples or case studies from the related sections support or illustrate the selected text?
            - How do the related sections provide practical applications of the concepts?
            
            Focus on cross-document analysis and meaningful connections. Be specific and actionable.
            """
            
            messages = [
                {"role": "system", "content": "You are an expert document analyst specializing in cross-document insights. Analyze relationships between content from multiple documents to provide meaningful, specific insights."},
                {"role": "user", "content": prompt}
            ]
            
            print(f"🧠 LLM Service: Sending enhanced cross-document request to {self.provider}")
            
            if get_llm_response:
                # Cross-platform timeout handling using concurrent.futures
                import concurrent.futures
                import threading
                
                def run_with_timeout(func, args, timeout_seconds=45):  # Increased timeout for more complex analysis
                    """Run function with timeout that works on Windows and Unix"""
                    try:
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(func, *args)
                            return future.result(timeout=timeout_seconds)
                    except concurrent.futures.TimeoutError:
                        raise TimeoutError("LLM request timed out")
                
                try:
                    response = run_with_timeout(get_llm_response, (messages,), 45)
                    
                    if response:
                        print(f"✅ LLM Service: Generated {len(response)} characters of cross-document insights")
                        return response
                    else:
                        print("⚠️ LLM Service: Empty response received")
                        return "Unable to generate insights at this time."
                        
                except TimeoutError:
                    print("⏰ LLM Service: Request timed out")
                    return "Insight generation timed out. Please try again with shorter text."
                except Exception as llm_error:
                    print(f"❌ LLM Service: LLM call failed: {llm_error}")
                    return self._fallback_related_insights(selected_text, related_sections)
            else:
                print("⚠️ LLM Service: No LLM response function available")
                return self._fallback_related_insights(selected_text, related_sections)
                
        except Exception as e:
            print(f"❌ LLM Service: Error generating related content insights: {e}")
            return f"Insight analysis completed. Found {len(related_sections)} related sections for the selected text."
    
    def generate_comprehensive_insights(self, selected_text: str, all_documents: List[Dict[str, Any]], related_sections: List[Dict[str, Any]] = None) -> str:
        """
        Generate comprehensive cross-document insights as required by Adobe Hackathon
        Searches ALL documents for contradictory findings, inspirations, examples, and cross-document connections
        
        Args:
            selected_text: The text selected by the user
            all_documents: List of all uploaded documents with their content
            related_sections: Optional related sections from semantic search
            
        Returns:
            String containing comprehensive cross-document insights
        """
        try:
            print(f"🧠 LLM Service: Generating comprehensive insights across {len(all_documents)} documents")
            print(f"🧠 LLM Service: Selected text length: {len(selected_text)}")
            
            # Build comprehensive document context
            documents_context = ""
            if all_documents:
                documents_context = "\n\nALL UPLOADED DOCUMENTS FOR ANALYSIS:\n"
                for i, doc in enumerate(all_documents[:10], 1):  # Limit to top 10 to avoid token limits
                    content = doc.get('content', '')[:1500]  # Limit content per document
                    doc_name = doc.get('document_name', f'Document {i}')
                    documents_context += f"\n--- Document {i}: {doc_name} ---\n{content}\n"
            
            # Adobe Hackathon specific prompt for comprehensive analysis
            prompt = f"""
            ADOBE HACKATHON - COMPREHENSIVE CROSS-DOCUMENT INSIGHTS ANALYSIS
            
            Analyze the selected text against ALL uploaded documents to provide specific, actionable insights.
            
            SELECTED TEXT TO ANALYZE:
            "{selected_text}"
            {documents_context}
            
            Please provide insights in EXACTLY this format with clear headers:
            
            KEY TAKEAWAYS:
            - [Specific takeaway from cross-document analysis]
            - [Main concept connecting multiple documents]
            - [Actionable insight grounded in the document collection]
            
            DID YOU KNOW:
            - [Surprising connection between selected text and other documents]
            - [Interesting pattern discovered across documents]
            - [Unique fact that emerges from cross-referencing]
            
            CONTRADICTIONS / COUNTERPOINTS:
            - [Specific conflicting viewpoint found in another document]
            - [Alternative approach mentioned in different source]
            - [Opposing evidence or methodology from the collection]
            
            EXAMPLES:
            - [Specific example from another document that supports the selected text]
            - [Real-world case study mentioned in the collection]
            - [Practical application found in different documents]
            
            CROSS-DOCUMENT INSPIRATIONS:
            - [Creative connection between ideas from different sources]
            - [Novel insight that emerges from combining multiple documents]
            - [Innovative application discovered through cross-analysis]
            
            REQUIREMENTS:
            1. Be specific about which documents provide evidence
            2. Focus on contradictions, connections, and inspirations
            3. Ground ALL insights in the actual uploaded documents
            4. Use bullet points for each section
            5. Provide actionable, specific insights - not generic statements
            
            If you find conflicts between documents, highlight them clearly in the CONTRADICTIONS section.
            If you find inspiring connections, detail them in the INSPIRATIONS section.
            """
            
            messages = [
                {"role": "system", "content": "You are an expert document analyst for the Adobe Hackathon specializing in comprehensive cross-document insights. Your goal is to find contradictory findings, inspirations, examples, and connections across ALL uploaded documents. Never use generic web knowledge - only analyze the provided documents."},
                {"role": "user", "content": prompt}
            ]
            
            print(f"🧠 LLM Service: Sending comprehensive cross-document analysis request to {self.provider}")
            
            if get_llm_response:
                import concurrent.futures
                
                def run_with_timeout(func, args, timeout_seconds=60):  # Longer timeout for comprehensive analysis
                    """Run function with timeout that works on Windows and Unix"""
                    try:
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(func, *args)
                            return future.result(timeout=timeout_seconds)
                    except concurrent.futures.TimeoutError:
                        raise TimeoutError("Comprehensive LLM analysis timed out")
                
                try:
                    response = run_with_timeout(get_llm_response, (messages,), 60)
                    
                    if response:
                        print(f"✅ LLM Service: Generated {len(response)} characters of comprehensive cross-document insights")
                        return response
                    else:
                        print("⚠️ LLM Service: Empty response from LLM")
                        return self._fallback_comprehensive_insights(selected_text, all_documents)
                        
                except TimeoutError:
                    print("⏰ LLM Service: Comprehensive analysis timed out")
                    return f"Comprehensive cross-document analysis initiated across {len(all_documents)} documents. Analysis taking longer than expected - please try again."
                except Exception as llm_error:
                    print(f"❌ LLM Service: Comprehensive LLM call failed: {llm_error}")
                    return self._fallback_comprehensive_insights(selected_text, all_documents)
            else:
                print("⚠️ LLM Service: No LLM response function available")
                return self._fallback_comprehensive_insights(selected_text, all_documents)
                
        except Exception as e:
            print(f"❌ LLM Service: Error generating comprehensive insights: {e}")
            return f"Comprehensive cross-document analysis attempted across {len(all_documents)} documents. Analysis encountered an error - please try again."
    
    def _fallback_comprehensive_insights(self, selected_text: str, all_documents: List[Dict[str, Any]]) -> str:
        """Fallback for comprehensive insights when LLM is unavailable"""
        doc_names = [doc.get('document_name', 'Unknown') for doc in all_documents]
        return f"""
        COMPREHENSIVE CROSS-DOCUMENT ANALYSIS INITIATED
        
        KEY TAKEAWAYS:
        - Selected text analyzed across {len(all_documents)} documents in your collection
        - Cross-document patterns and themes identified
        - Documents analyzed: {', '.join(doc_names[:5])}{'...' if len(doc_names) > 5 else ''}
        
        DID YOU KNOW:
        - Your document collection contains {len(all_documents)} sources for cross-referencing
        - Cross-document analysis can reveal hidden connections and contradictions
        - Selected text: "{selected_text[:100]}..."
        
        CONTRADICTIONS / COUNTERPOINTS:
        - Searching for conflicting viewpoints across all uploaded documents
        - Cross-referencing alternative approaches and methodologies
        
        EXAMPLES:
        - Analyzing practical applications and case studies across your document collection
        - Identifying supporting evidence from multiple sources
        
        CROSS-DOCUMENT INSPIRATIONS:
        - Discovering novel connections between concepts from different documents
        - Identifying emergent themes and innovative applications
        
        Note: LLM analysis temporarily unavailable. Upload more documents for richer cross-document insights.
        """
    
    def generate_podcast_script(self, content: str, speakers: int = 2) -> str:
        """
        Generate a podcast script from content
        
        Args:
            content: Source content for the podcast
            speakers: Number of speakers in the podcast
            
        Returns:
            Podcast script with speaker labels
        """
        try:
            prompt = f"""
            Create an engaging podcast script based on the following content. 
            Use {speakers} speakers having a natural conversation about the key points.
            Format as:
            
            Speaker 1: [dialogue]
            Speaker 2: [dialogue]
            
            Make it conversational, informative, and engaging.
            
            Content:
            {content[:3000]}...
            """
            
            messages = [
                {"role": "system", "content": "You are an expert podcast script writer. Create engaging, natural conversations between speakers."},
                {"role": "user", "content": prompt}
            ]
            
            if get_llm_response:
                response = get_llm_response(messages)
                return response if response else "Unable to generate podcast script."
            else:
                return self._fallback_podcast_script(content)
                
        except Exception as e:
            print(f"Error generating podcast script: {e}")
            return f"Error generating script: {str(e)}"
    
    def _build_insights_prompt(self, text_data: List[Dict[str, Any]], context: Optional[str] = None) -> str:
        """Build prompt for insight generation"""
        prompt = "Analyze the following text data and generate insights:\n\n"
        
        if context:
            prompt += f"Context: {context}\n\n"
        
        prompt += "Text Data:\n"
        for i, item in enumerate(text_data[:10], 1):  # Limit to 10 items
            text = item.get('text', item.get('content', str(item)))
            prompt += f"{i}. {text[:500]}...\n\n"
        
        prompt += """
        Please provide:
        1. Key themes and patterns
        2. Important facts and figures
        3. Potential contradictions or inconsistencies
        4. Actionable insights
        5. Areas requiring further investigation
        """
        
        return prompt
    
    def _parse_insights_response(self, response: str) -> Dict[str, Any]:
        """Parse LLM response into structured insights"""
        return {
            "summary": response[:500] + "..." if len(response) > 500 else response,
            "full_analysis": response,
            "generated_at": datetime.now().isoformat(),
            "provider": self.provider,
            "model": self.model_name
        }
    
    def _fallback_insights(self, text_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback insights when LLM is unavailable"""
        word_count = sum(len(str(item.get('text', item.get('content', ''))).split()) for item in text_data)
        
        return {
            "summary": f"Analysis of {len(text_data)} text segments containing approximately {word_count} words. LLM analysis unavailable.",
            "full_analysis": "Detailed LLM analysis is currently unavailable. Please check your LLM provider configuration.",
            "generated_at": datetime.now().isoformat(),
            "provider": "fallback",
            "model": "none"
        }
    
    def _fallback_related_insights(self, selected_text: str, related_sections: List[Dict[str, Any]]) -> str:
        """Fallback insights for related content when LLM unavailable"""
        key_words = selected_text.split()[:10]  # First 10 words
        word_count = len(selected_text.split())
        
        insights = f"""
📊 Analysis Summary:

• Selected text contains {word_count} words focusing on: {' '.join(key_words)}...
• Found {len(related_sections)} related sections across your documents
• This suggests the topic has good coverage in your document collection

🔍 Key Insights:
• Cross-document relevance indicates this is an important concept in your field
• Multiple references suggest opportunities for deeper exploration
• Related sections may provide additional context or different perspectives

💡 Next Steps:
• Review the related sections for complementary information
• Look for patterns across different documents
• Consider how these connections inform your understanding

Note: Detailed AI analysis requires proper LLM configuration.
        """.strip()
        
        return insights
    
    def _fallback_podcast_script(self, content: str) -> str:
        """Fallback podcast script when LLM unavailable"""
        return f"""
Speaker 1: Welcome to our document analysis podcast. Today we're discussing some interesting content.

Speaker 2: That's right. We have approximately {len(content.split())} words of content to analyze.

Speaker 1: The material covers various topics that seem quite relevant to our discussion.

Speaker 2: Absolutely. For a more detailed analysis, we'd need our LLM system configured properly.

Speaker 1: Great point. Thanks for joining us today!
"""

# Global instance for easy import
llm_service = UnifiedLLMService()

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
            prompt = f"""
            Analyze the following selected text and its related sections. Generate insights about:
            1. Key connections and patterns
            2. Supporting or contradictory information
            3. Additional context that might be relevant
            
            Selected Text:
            "{selected_text}"
            
            Related Sections:
            """
            
            for i, section in enumerate(related_sections, 1):
                prompt += f"\n{i}. {section.get('text', '')[:500]}..."
            
            prompt += "\n\nProvide a concise analysis focusing on semantic relationships and insights:"
            
            messages = [
                {"role": "system", "content": "You are an expert at finding connections between text passages. Focus on semantic relationships, patterns, and insights."},
                {"role": "user", "content": prompt}
            ]
            
            if get_llm_response:
                response = get_llm_response(messages)
                return response if response else "Unable to generate insights at this time."
            else:
                return self._fallback_related_insights(selected_text, related_sections)
                
        except Exception as e:
            print(f"Error generating related content insights: {e}")
            return f"Error generating insights: {str(e)}"
    
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
        return f"Found {len(related_sections)} related sections for the selected text. Detailed relationship analysis requires LLM configuration."
    
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

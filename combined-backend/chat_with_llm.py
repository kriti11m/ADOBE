"""
LLM Chat Interface for Adobe Contest
Supports multiple LLM providers: Gemini, OpenAI, Azure OpenAI, Ollama
Environment-based configuration as per contest requirements
"""

import os
import json
import time
from typing import List, Dict, Any, Optional

def get_llm_response(messages: List[Dict[str, str]], stream: bool = False) -> str:
    """
    Get response from configured LLM provider
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        stream: Whether to stream the response (not used for contest)
    
    Returns:
        String response from the LLM
    """
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    try:
        if provider == "gemini":
            return _get_gemini_response(messages)
        elif provider == "openai":
            return _get_openai_response(messages)
        elif provider == "azure":
            return _get_azure_response(messages)
        elif provider == "ollama":
            return _get_ollama_response(messages)
        else:
            print(f"❌ Unsupported LLM provider: {provider}")
            return None
            
    except Exception as e:
        print(f"❌ LLM Error: {e}")
        return None

def _get_gemini_response(messages: List[Dict[str, str]]) -> str:
    """Get response from Google Gemini"""
    try:
        import google.generativeai as genai
        
        # Get API key from environment
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            # Try alternative environment variable names
            api_key = os.getenv("GEMINI_API_KEY")
            
        if not api_key:
            print("❌ Gemini API key not found in environment variables")
            return None
            
        genai.configure(api_key=api_key)
        
        # Get model name
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        model = genai.GenerativeModel(model_name)
        
        # Convert messages to Gemini format
        # Combine system and user messages for Gemini
        full_prompt = ""
        for message in messages:
            if message["role"] == "system":
                full_prompt += f"System: {message['content']}\n\n"
            elif message["role"] == "user":
                full_prompt += f"User: {message['content']}\n\n"
            elif message["role"] == "assistant":
                full_prompt += f"Assistant: {message['content']}\n\n"
        
        # Generate response
        response = model.generate_content(full_prompt)
        
        if response and response.text:
            return response.text.strip()
        else:
            print("❌ Empty response from Gemini")
            return None
            
    except ImportError:
        print("❌ Google Generative AI library not installed. Install with: pip install google-generativeai")
        return None
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        return None

def _get_openai_response(messages: List[Dict[str, str]]) -> str:
    """Get response from OpenAI"""
    try:
        import openai
        
        # Get API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("❌ OpenAI API key not found")
            return None
            
        client = openai.OpenAI(api_key=api_key)
        
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o")
        
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            max_tokens=2000,
            temperature=0.7
        )
        
        if response.choices and response.choices[0].message:
            return response.choices[0].message.content.strip()
        else:
            print("❌ Empty response from OpenAI")
            return None
            
    except ImportError:
        print("❌ OpenAI library not installed. Install with: pip install openai")
        return None
    except Exception as e:
        print(f"❌ OpenAI API Error: {e}")
        return None

def _get_azure_response(messages: List[Dict[str, str]]) -> str:
    """Get response from Azure OpenAI"""
    try:
        import openai
        
        # Get Azure credentials
        api_key = os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        deployment_name = os.getenv("AZURE_DEPLOYMENT_NAME", "gpt-4o")
        api_version = os.getenv("AZURE_API_VERSION", "2024-02-15-preview")
        
        if not api_key or not endpoint:
            print("❌ Azure OpenAI credentials not found")
            return None
            
        client = openai.AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint
        )
        
        response = client.chat.completions.create(
            model=deployment_name,
            messages=messages,
            max_tokens=2000,
            temperature=0.7
        )
        
        if response.choices and response.choices[0].message:
            return response.choices[0].message.content.strip()
        else:
            print("❌ Empty response from Azure OpenAI")
            return None
            
    except ImportError:
        print("❌ OpenAI library not installed. Install with: pip install openai")
        return None
    except Exception as e:
        print(f"❌ Azure OpenAI Error: {e}")
        return None

def _get_ollama_response(messages: List[Dict[str, str]]) -> str:
    """Get response from Ollama (local LLM)"""
    try:
        import requests
        
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model_name = os.getenv("OLLAMA_MODEL", "llama3")
        
        # Convert messages to a single prompt for Ollama
        prompt = ""
        for message in messages:
            if message["role"] == "system":
                prompt += f"System: {message['content']}\n\n"
            elif message["role"] == "user":
                prompt += f"User: {message['content']}\n\n"
            elif message["role"] == "assistant":
                prompt += f"Assistant: {message['content']}\n\n"
        
        prompt += "Assistant: "
        
        # Make request to Ollama
        response = requests.post(
            f"{base_url}/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "").strip()
        else:
            print(f"❌ Ollama API Error: {response.status_code}")
            return None
            
    except ImportError:
        print("❌ Requests library not installed. Install with: pip install requests")
        return None
    except Exception as e:
        print(f"❌ Ollama Error: {e}")
        return None

# Test function
def test_llm_connection():
    """Test the LLM connection"""
    test_messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say 'Hello, LLM connection successful!' if you can hear me."}
    ]
    
    provider = os.getenv("LLM_PROVIDER", "gemini")
    print(f"🧪 Testing LLM connection with provider: {provider}")
    
    response = get_llm_response(test_messages)
    if response:
        print(f"✅ LLM Test Successful: {response[:100]}...")
        return True
    else:
        print("❌ LLM Test Failed")
        return False

if __name__ == "__main__":
    # Test the connection when run directly
    test_llm_connection()

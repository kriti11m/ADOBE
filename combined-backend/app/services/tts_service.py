"""
Text-to-Speech service for converting podcast scripts to audio
Supports multiple TTS engines including Google TTS and pyttsx3
"""

import os
import io
import tempfile
import uuid
from typing import Dict, Any, Optional, BinaryIO
from pathlib import Path
import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor

# Try to import TTS libraries with better error handling
PYTTSX3_AVAILABLE = False
GTTS_AVAILABLE = False

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
    print("✅ pyttsx3 imported successfully")
except ImportError as e:
    print(f"❌ pyttsx3 import failed: {e}")
except Exception as e:
    print(f"❌ pyttsx3 unexpected error: {e}")

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
    print("✅ gtts imported successfully")
except ImportError as e:
    print(f"❌ gtts import failed: {e}")
except Exception as e:
    print(f"❌ gtts unexpected error: {e}")

import logging

logger = logging.getLogger(__name__)

print(f"🎵 TTS Service initialized - GTTS: {GTTS_AVAILABLE}, pyttsx3: {PYTTSX3_AVAILABLE}")


class TextToSpeechService:
    """
    Text-to-Speech service with support for multiple engines
    """
    
    def __init__(self):
        self.audio_output_dir = Path("temp_audio")
        self.audio_output_dir.mkdir(exist_ok=True)
        self.executor = ThreadPoolExecutor(max_workers=2)
        
    def _clean_text_for_tts(self, text: str) -> str:
        """
        Clean text for better TTS pronunciation
        """
        # Remove markdown formatting
        text = text.replace("**", "")
        text = text.replace("*", "")
        text = text.replace("#", "")
        text = text.replace("`", "")
        
        # Replace common abbreviations
        replacements = {
            "AI": "Artificial Intelligence",
            "PDF": "P D F",
            "URL": "U R L",
            "API": "A P I",
            "vs.": "versus",
            "etc.": "et cetera",
            "e.g.": "for example",
            "i.e.": "that is",
        }
        
        for abbrev, full_form in replacements.items():
            text = text.replace(abbrev, full_form)
            
        return text
    
    async def generate_audio_gtts(
        self, 
        text: str, 
        language: str = "en",
        slow: bool = False
    ) -> Optional[bytes]:
        """
        Generate audio using Google Text-to-Speech
        """
        if not GTTS_AVAILABLE:
            logger.error("Google TTS not available")
            return None
            
        try:
            cleaned_text = self._clean_text_for_tts(text)
            
            # Run TTS in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            audio_data = await loop.run_in_executor(
                self.executor,
                self._generate_gtts_audio,
                cleaned_text,
                language,
                slow
            )
            
            return audio_data
            
        except Exception as e:
            logger.error(f"Error generating audio with Google TTS: {e}")
            return None
    
    def _generate_gtts_audio(self, text: str, language: str, slow: bool) -> bytes:
        """
        Internal method to generate audio with Google TTS
        """
        try:
            tts = gTTS(text=text, lang=language, slow=slow)
            
            # Save to memory buffer
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            return audio_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error in GTTS audio generation: {e}")
            raise
    
    async def generate_audio_pyttsx3(
        self,
        text: str,
        voice_rate: int = 180,
        voice_volume: float = 0.9
    ) -> Optional[bytes]:
        """
        Generate audio using pyttsx3 (offline TTS)
        """
        if not PYTTSX3_AVAILABLE:
            logger.error("pyttsx3 not available")
            return None
            
        try:
            cleaned_text = self._clean_text_for_tts(text)
            
            # Run TTS in thread pool
            loop = asyncio.get_event_loop()
            audio_file_path = await loop.run_in_executor(
                self.executor,
                self._generate_pyttsx3_audio,
                cleaned_text,
                voice_rate,
                voice_volume
            )
            
            if audio_file_path and os.path.exists(audio_file_path):
                with open(audio_file_path, 'rb') as f:
                    audio_data = f.read()
                
                # Clean up temp file
                os.unlink(audio_file_path)
                return audio_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating audio with pyttsx3: {e}")
            return None
    
    def _generate_pyttsx3_audio(
        self, 
        text: str, 
        voice_rate: int, 
        voice_volume: float
    ) -> Optional[str]:
        """
        Internal method to generate audio with pyttsx3
        """
        try:
            engine = pyttsx3.init()
            
            # Configure voice properties
            engine.setProperty('rate', voice_rate)
            engine.setProperty('volume', voice_volume)
            
            # Try to set a better voice if available
            voices = engine.getProperty('voices')
            if voices:
                # Prefer female voices or voices with better quality
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                        engine.setProperty('voice', voice.id)
                        break
            
            # Generate unique filename
            audio_file = self.audio_output_dir / f"podcast_{uuid.uuid4().hex}.wav"
            
            # Save audio to file
            engine.save_to_file(text, str(audio_file))
            engine.runAndWait()
            
            return str(audio_file)
            
        except Exception as e:
            logger.error(f"Error in pyttsx3 audio generation: {e}")
            return None
    
    async def generate_podcast_audio(
        self,
        podcast_script: Dict[str, Any],
        tts_engine: str = "gtts",
        voice_settings: Optional[Dict[str, Any]] = None
    ) -> Optional[bytes]:
        """
        Generate complete podcast audio from script
        """
        try:
            # Extract script text
            script_text = ""
            
            if isinstance(podcast_script, dict):
                if 'script' in podcast_script:
                    script_text = podcast_script['script']
                elif 'content' in podcast_script:
                    script_text = podcast_script['content']
                else:
                    # Try to construct from other fields
                    title = podcast_script.get('title', '')
                    description = podcast_script.get('description', '')
                    takeaways = podcast_script.get('key_takeaways', [])
                    
                    script_parts = []
                    if title:
                        script_parts.append(f"Welcome to today's podcast: {title}")
                    if description:
                        script_parts.append(description)
                    if takeaways:
                        script_parts.append("Here are the key takeaways:")
                        for takeaway in takeaways:
                            script_parts.append(takeaway)
                    
                    script_text = ". ".join(script_parts)
            else:
                script_text = str(podcast_script)
            
            if not script_text.strip():
                logger.error("No script text found for TTS generation")
                return None
            
            # Apply voice settings
            settings = voice_settings or {}
            
            if tts_engine.lower() == "gtts" and GTTS_AVAILABLE:
                return await self.generate_audio_gtts(
                    script_text,
                    language=settings.get('language', 'en'),
                    slow=settings.get('slow', False)
                )
            elif tts_engine.lower() == "pyttsx3" and PYTTSX3_AVAILABLE:
                return await self.generate_audio_pyttsx3(
                    script_text,
                    voice_rate=settings.get('rate', 180),
                    voice_volume=settings.get('volume', 0.9)
                )
            else:
                # Fallback to available engine
                if GTTS_AVAILABLE:
                    return await self.generate_audio_gtts(script_text)
                elif PYTTSX3_AVAILABLE:
                    return await self.generate_audio_pyttsx3(script_text)
                else:
                    logger.error("No TTS engines available")
                    return None
                    
        except Exception as e:
            logger.error(f"Error generating podcast audio: {e}")
            return None
    
    def get_available_engines(self) -> Dict[str, bool]:
        """
        Get list of available TTS engines
        """
        return {
            "gtts": GTTS_AVAILABLE,
            "pyttsx3": PYTTSX3_AVAILABLE
        }
    
    def cleanup_temp_files(self):
        """
        Clean up temporary audio files
        """
        try:
            for file_path in self.audio_output_dir.glob("podcast_*.wav"):
                if file_path.is_file():
                    file_path.unlink()
        except Exception as e:
            logger.error(f"Error cleaning up temp files: {e}")


# Global service instance
tts_service = TextToSpeechService()

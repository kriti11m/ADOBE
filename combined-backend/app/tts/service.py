"""
Text-to-Speech Service for Audio Overview/Podcast Generation
Supports multiple TTS engines with fallback options
"""
import os
import tempfile
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

class TTSService:
    """Text-to-Speech service with multiple engine support"""
    
    def __init__(self):
        self.available_engines = []
        self._initialize_engines()
    
    def _initialize_engines(self):
        """Initialize available TTS engines"""
        # Check for gtts (Google TTS)
        try:
            import gtts
            self.available_engines.append('gtts')
        except ImportError:
            pass
        
        # Check for pyttsx3 (offline TTS)
        try:
            import pyttsx3
            self.available_engines.append('pyttsx3')
        except ImportError:
            pass
        
        logger.info(f"Available TTS engines: {self.available_engines}")
    
    async def generate_audio(self, text: str, output_path: str, engine: str = None, voice: str = 'female', speed: float = 1.0) -> bool:
        """
        Generate audio file from text
        
        Args:
            text: Text to convert to speech
            output_path: Path where to save the audio file
            engine: Specific engine to use (optional)
            voice: Voice type - 'male' or 'female' (default: 'female')
            speed: Speech speed multiplier (0.5 = slow, 1.0 = normal, 1.5 = fast)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.available_engines:
                logger.error("No TTS engines available")
                return False
            
            # Prefer pyttsx3 for voice control, gtts as fallback
            if engine:
                engine_to_use = engine if engine in self.available_engines else self.available_engines[0]
            else:
                # Always prefer pyttsx3 when available for proper voice control
                if 'pyttsx3' in self.available_engines:
                    engine_to_use = 'pyttsx3'
                elif 'gtts' in self.available_engines:
                    engine_to_use = 'gtts'
                else:
                    engine_to_use = self.available_engines[0] if self.available_engines else None
            
            logger.info(f"Using TTS engine: {engine_to_use} with voice: {voice}")
            
            if not engine_to_use:
                logger.error("No TTS engine available")
                return False
            
            if engine_to_use == 'gtts':
                return await self._generate_with_gtts(text, output_path, speed, voice)
            elif engine_to_use == 'pyttsx3':
                return await self._generate_with_pyttsx3(text, output_path, voice, speed)
            else:
                logger.error(f"Unsupported engine: {engine_to_use}")
                return False
                
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            return False
    
    async def _generate_with_gtts(self, text: str, output_path: str, speed: float = 1.0, voice: str = 'female') -> bool:
        """Generate audio using Google TTS (limited voice options)"""
        try:
            from gtts import gTTS
            
            # Note: gTTS has limited voice control - it uses Google's default voice
            # For proper male/female voices, pyttsx3 should be preferred
            logger.warning(f"gTTS has limited voice options - requested {voice} voice may not be distinct")
            
            # gTTS basic generation
            tts = gTTS(text=text, lang='en', slow=(speed < 0.8))
            tts.save(output_path)
            
            logger.info(f"Generated audio with gTTS ({voice} voice requested): {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"gTTS generation failed: {e}")
            return False
    
    async def _generate_with_pyttsx3(self, text: str, output_path: str, voice: str = 'female', speed: float = 1.0) -> bool:
        """Generate audio using pyttsx3 (offline)"""
        try:
            import pyttsx3
            
            engine = pyttsx3.init()
            
            # Get available voices
            voices = engine.getProperty('voices')
            selected_voice = None
            
            if voices:
                logger.info(f"Available voices: {len(voices)}")
                # Log all available voices for debugging
                for i, voice_obj in enumerate(voices):
                    logger.info(f"Voice {i}: Name='{voice_obj.name}' ID='{voice_obj.id}'")
                
                # Detailed voice matching (more reliable than quick selection)
                for i, voice_obj in enumerate(voices):
                    voice_name = voice_obj.name.lower() if voice_obj.name else ""
                    voice_id = voice_obj.id.lower() if voice_obj.id else ""
                    
                    if voice == 'female':
                        # Look for female voice indicators
                        if any(keyword in voice_name for keyword in ['female', 'woman', 'girl', 'she', 'zira', 'hazel', 'eva', 'samantha']) or \
                           any(keyword in voice_id for keyword in ['female', 'zira', 'hazel', 'eva', 'samantha']):
                            selected_voice = voice_obj.id
                            logger.info(f"Selected female voice: {voice_obj.name} ({voice_obj.id})")
                            break
                    elif voice == 'male':
                        # Look for male voice indicators  
                        if any(keyword in voice_name for keyword in ['male', 'man', 'boy', 'he', 'david', 'mark', 'daniel', 'alex']) or \
                           any(keyword in voice_id for keyword in ['male', 'david', 'mark', 'daniel', 'alex']):
                            selected_voice = voice_obj.id
                            logger.info(f"Selected male voice: {voice_obj.name} ({voice_obj.id})")
                            break
                
                # Fallback logic if no specific voice found
                if not selected_voice:
                    logger.info("No specific voice match found, using fallback logic...")
                    if voice == 'male' and len(voices) > 1:
                        # Use second voice as male fallback
                        selected_voice = voices[1].id
                        logger.info(f"Using fallback male voice: {voices[1].name} ({voices[1].id})")
                    else:
                        # Use first voice as female fallback
                        selected_voice = voices[0].id
                        logger.info(f"Using fallback female voice: {voices[0].name} ({voices[0].id})")
                
                if selected_voice:
                    engine.setProperty('voice', selected_voice)
                    logger.info(f"Voice set to: {selected_voice}")
            
            # Set speech rate (words per minute) - optimize for faster processing
            base_rate = engine.getProperty('rate')
            new_rate = int(base_rate * speed)
            engine.setProperty('rate', new_rate)
            
            # Set volume
            engine.setProperty('volume', 0.9)
            
            # Save to file
            engine.save_to_file(text, output_path)
            engine.runAndWait()
            
            logger.info(f"Generated audio with pyttsx3: {output_path} (voice: {voice}, speed: {speed})")
            return True
            
        except Exception as e:
            logger.error(f"pyttsx3 generation failed: {e}")
            return False
    
    def get_available_engines(self) -> List[str]:
        """Get list of available TTS engines"""
        return self.available_engines.copy()

# Create global instance
tts_service = TTSService()

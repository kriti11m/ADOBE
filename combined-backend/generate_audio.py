import os
import requests
import json
import io

# Conditional imports for TTS providers
try:
    from azure.cognitiveservices.speech import SpeechConfig, SpeechSynthesizer, AudioConfig
    from azure.cognitiveservices.speech.audio import AudioOutputConfig
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False

try:
    import google.cloud.texttospeech as tts
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

"""
Audio Generation Interface with Multi-Provider Support

This module provides a unified interface for generating audio from text using various TTS providers
including Azure TTS, Google Cloud TTS, and local TTS solutions.

SETUP:
Users are expected to set appropriate environment variables for their chosen TTS provider
before calling the generate_audio function.

Environment Variables:

TTS_PROVIDER (default: "azure")
    - "azure": Azure Text-to-Speech (default for contest evaluation)
    - "gcp": Google Cloud Text-to-Speech
    - "local": Local TTS solutions (gTTS, pyttsx3)

For Azure TTS:
    AZURE_TTS_KEY: Your Azure TTS API key
    AZURE_TTS_ENDPOINT: Azure TTS endpoint URL
    AZURE_TTS_VOICE (default: "en-US-JennyNeural"): Voice name to use

For Google Cloud TTS:
    GOOGLE_APPLICATION_CREDENTIALS: Path to service account JSON file
    GCP_TTS_VOICE (default: "en-US-Neural2-F"): Voice name to use

For Local TTS:
    LOCAL_TTS_ENGINE (default: "gtts"): "gtts" or "pyttsx3"

Usage:
    # Set your environment variables first, then use the function
    audio_data = generate_audio("Hello, this is a test message.")
    
    # Save to file
    with open("output.mp3", "wb") as f:
        f.write(audio_data)
"""

def generate_audio(text, output_filename=None):
    """
    Generate audio from text using the configured TTS provider.
    
    Args:
        text (str): Text to convert to speech
        output_filename (str, optional): If provided, saves audio to this file
    
    Returns:
        bytes: Audio data in appropriate format (MP3/WAV)
    """
    provider = os.getenv("TTS_PROVIDER", "azure").lower()
    
    if provider == "azure":
        return _generate_azure_audio(text, output_filename)
    elif provider == "gcp":
        return _generate_gcp_audio(text, output_filename)
    elif provider == "local":
        return _generate_local_audio(text, output_filename)
    else:
        raise ValueError(f"Unsupported TTS_PROVIDER: {provider}")

def _generate_azure_audio(text, output_filename=None):
    """Generate audio using Azure TTS with contest-required AZURE_TTS_DEPLOYMENT support"""
    if not AZURE_AVAILABLE:
        raise ValueError("Azure TTS libraries not available. Install azure-cognitiveservices-speech package.")
    
    tts_key = os.getenv("AZURE_TTS_KEY")
    tts_endpoint = os.getenv("AZURE_TTS_ENDPOINT")
    voice_name = os.getenv("AZURE_TTS_VOICE", "en-US-JennyNeural")
    
    # Contest-required deployment name (defaults to 'tts' as per evaluation requirements)
    tts_deployment = os.getenv("AZURE_TTS_DEPLOYMENT", "tts")
    
    if not tts_key or not tts_endpoint:
        raise ValueError("AZURE_TTS_KEY and AZURE_TTS_ENDPOINT must be set for Azure TTS")
    
    try:
        # Configure Azure Speech SDK with deployment name
        speech_config = SpeechConfig(subscription=tts_key, endpoint=tts_endpoint)
        speech_config.speech_synthesis_voice_name = voice_name
        
        # Set deployment name for Azure OpenAI Service TTS (contest requirement)
        if hasattr(speech_config, 'set_property'):
            speech_config.set_property("AZURE_TTS_DEPLOYMENT", tts_deployment)
        speech_config = SpeechConfig(subscription=tts_key, endpoint=tts_endpoint)
        speech_config.speech_synthesis_voice_name = voice_name
        
        if output_filename:
            # Save directly to file
            audio_config = AudioConfig(filename=output_filename)
            synthesizer = SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
            result = synthesizer.speak_text_async(text).get()
            
            # Read the file back as bytes
            with open(output_filename, 'rb') as f:
                return f.read()
        else:
            # Generate in-memory audio
            synthesizer = SpeechSynthesizer(speech_config=speech_config, audio_config=None)
            result = synthesizer.speak_text_async(text).get()
            
            if result.reason == result.reason.SynthesizingAudioCompleted:
                return result.audio_data
            else:
                raise RuntimeError(f"Azure TTS failed: {result.reason}")
                
    except Exception as e:
        raise RuntimeError(f"Azure TTS call failed: {e}")

def _generate_gcp_audio(text, output_filename=None):
    """Generate audio using Google Cloud TTS"""
    if not GCP_AVAILABLE:
        raise ValueError("Google Cloud TTS libraries not available. Install google-cloud-texttospeech package.")
    
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    voice_name = os.getenv("GCP_TTS_VOICE", "en-US-Neural2-F")
    
    if not credentials_path:
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS must be set for Google Cloud TTS")
    
    try:
        # Initialize the TTS client
        client = tts.TextToSpeechClient()
        
        # Set the text input
        synthesis_input = tts.SynthesisInput(text=text)
        
        # Build the voice request
        voice = tts.VoiceSelectionParams(
            language_code="en-US",
            name=voice_name
        )
        
        # Select the type of audio file
        audio_config = tts.AudioConfig(
            audio_encoding=tts.AudioEncoding.MP3
        )
        
        # Perform the text-to-speech request
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # Save to file if requested
        if output_filename:
            with open(output_filename, "wb") as f:
                f.write(response.audio_content)
        
        return response.audio_content
        
    except Exception as e:
        raise RuntimeError(f"Google Cloud TTS call failed: {e}")

def _generate_local_audio(text, output_filename=None):
    """Generate audio using local TTS (gTTS or pyttsx3)"""
    engine = os.getenv("LOCAL_TTS_ENGINE", "gtts").lower()
    
    if engine == "gtts":
        if not GTTS_AVAILABLE:
            raise ValueError("gTTS library not available. Install gtts package.")
        
        try:
            # Use gTTS for online local generation
            tts = gTTS(text=text, lang='en')
            
            if output_filename:
                tts.save(output_filename)
                with open(output_filename, 'rb') as f:
                    return f.read()
            else:
                # Generate in-memory
                fp = io.BytesIO()
                tts.write_to_fp(fp)
                fp.seek(0)
                return fp.read()
                
        except Exception as e:
            raise RuntimeError(f"gTTS call failed: {e}")
    
    elif engine == "pyttsx3":
        try:
            import pyttsx3
            
            # Initialize pyttsx3
            engine = pyttsx3.init()
            
            # Configure voice properties
            engine.setProperty('rate', 150)    # Speed of speech
            engine.setProperty('volume', 0.9)  # Volume (0.0 to 1.0)
            
            if output_filename:
                # Save to file
                engine.save_to_file(text, output_filename)
                engine.runAndWait()
                
                # Read back the file
                with open(output_filename, 'rb') as f:
                    return f.read()
            else:
                # pyttsx3 doesn't support in-memory generation easily
                # Save to temporary file and read back
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                    engine.save_to_file(text, tmp.name)
                    engine.runAndWait()
                    
                    with open(tmp.name, 'rb') as f:
                        audio_data = f.read()
                    
                    os.unlink(tmp.name)
                    return audio_data
                    
        except Exception as e:
            raise RuntimeError(f"pyttsx3 call failed: {e}")
    
    else:
        raise ValueError(f"Unsupported LOCAL_TTS_ENGINE: {engine}")

if __name__ == "__main__":
    test_text = "Hello, this is a test of the audio generation system."
    
    try:
        print("Generating audio...")
        audio_data = generate_audio(test_text, "test_output.mp3")
        print(f"Generated {len(audio_data)} bytes of audio data")
        print("Audio saved as test_output.mp3")
    except Exception as e:
        print("Error:", str(e))

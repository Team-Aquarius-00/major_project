import os
import io
from openai import AsyncOpenAI
from pydantic import BaseModel

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class SpeechToTextRequest(BaseModel):
    """Request model for speech-to-text"""
    interview_id: str
    language: str = "en"

class TextToSpeechRequest(BaseModel):
    """Request model for text-to-speech"""
    interview_id: str
    text: str
    voice: str = "alloy"  # alloy, echo, fable, onyx, nova, shimmer

# Supported voices and models
VOICE_OPTIONS = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
LANGUAGE_OPTIONS = ["en", "es", "fr", "de", "it", "ja", "ko", "pt", "zh"]

async def speech_to_text(
    audio_data: bytes,
    language: str = "en"
) -> dict:
    """
    Convert speech audio to text using OpenAI Whisper
    
    Args:
        audio_data: Binary audio data (WAV, MP3, etc.)
        language: Language code (default: "en" for English)
    
    Returns:
        dict: {
            "success": bool,
            "text": str (transcribed text),
            "language": str,
            "error": str (if failed)
        }
    """
    try:
        if not audio_data:
            return {
                "success": False,
                "error": "No audio data provided",
                "text": "",
                "language": language
            }
        
        # Create file-like object from bytes
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.wav"
        
        # Call OpenAI Whisper API
        transcript = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language if language != "auto" else None,
            response_format="json"
        )
        
        return {
            "success": True,
            "text": transcript.text,
            "language": language,
            "error": None
        }
    
    except Exception as e:
        print(f"Speech-to-text error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "text": "",
            "language": language
        }

async def text_to_speech(
    text: str,
    voice: str = "alloy"
) -> dict:
    """
    Convert text to speech using OpenAI TTS
    
    Args:
        text: Text to convert to speech
        voice: Voice identifier (alloy, echo, fable, onyx, nova, shimmer)
    
    Returns:
        dict: {
            "success": bool,
            "audio": bytes (MP3 audio data),
            "voice": str,
            "error": str (if failed)
        }
    """
    try:
        if not text or not text.strip():
            return {
                "success": False,
                "error": "No text provided",
                "audio": None,
                "voice": voice
            }
        
        if voice not in VOICE_OPTIONS:
            return {
                "success": False,
                "error": f"Invalid voice. Must be one of: {', '.join(VOICE_OPTIONS)}",
                "audio": None,
                "voice": voice
            }
        
        # Call OpenAI TTS API
        response = await client.audio.speech.create(
            model="tts-1",  # tts-1 for lower latency, tts-1-hd for higher quality
            voice=voice,
            input=text,
            response_format="mp3"
        )
        
        # Convert to bytes
        audio_bytes = response.read()
        
        return {
            "success": True,
            "audio": audio_bytes,
            "voice": voice,
            "error": None
        }
    
    except Exception as e:
        print(f"Text-to-speech error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "audio": None,
            "voice": voice
        }

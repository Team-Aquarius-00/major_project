from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import io
from app.services.speech_service import speech_to_text, text_to_speech, VOICE_OPTIONS

router = APIRouter(prefix="/api/speech", tags=["speech"])

@router.post("/text-to-speech")
async def convert_text_to_speech(
    interview_id: str = Form(...),
    text: str = Form(...),
    voice: str = Form(default="alloy")
):
    """
    Convert text to speech using OpenAI TTS API
    
    Args:
        interview_id: Interview ID for tracking
        text: Text to convert to speech
        voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
    
    Returns:
        MP3 audio stream
    """
    try:
        if not text or text.strip() == "":
            raise HTTPException(status_code=400, detail="No text provided")
        
        if voice not in VOICE_OPTIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid voice. Must be one of: {', '.join(VOICE_OPTIONS)}"
            )
        
        # Call speech service
        result = await text_to_speech(text=text, voice=voice)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Return audio stream with proper headers
        audio_stream = io.BytesIO(result["audio"])
        return StreamingResponse(
            iter([audio_stream.getvalue()]),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=interview_{interview_id}.mp3",
                "Cache-Control": "no-cache"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in text-to-speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speech-to-text")
async def convert_speech_to_text(
    interview_id: str = Form(...),
    audio_file: UploadFile = File(...),
    language: str = Form(default="en")
):
    """
    Convert speech audio to text using OpenAI Whisper API
    
    Args:
        interview_id: Interview ID for tracking
        audio_file: Audio file upload (WAV, MP3, MP4, MPEG, WEBM)
        language: Language code (e.g., "en" for English)
    
    Returns:
        JSON: {
            "success": bool,
            "text": str (transcribed text),
            "language": str,
            "interview_id": str,
            "error": str (if failed)
        }
    """
    try:
        if not audio_file:
            raise HTTPException(status_code=400, detail="No audio file provided")
        
        # Read audio file
        audio_data = await audio_file.read()
        
        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # Call speech service
        result = await speech_to_text(audio_data=audio_data, language=language)
        
        # Add interview_id to response
        result["interview_id"] = interview_id
        
        if not result["success"]:
            return JSONResponse(status_code=500, content=result)
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in speech-to-text: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "text": "",
                "interview_id": interview_id,
                "language": language
            }
        )

@router.get("/voices")
async def get_available_voices():
    """
    Get list of available TTS voices
    
    Returns:
        JSON: {
            "success": bool,
            "voices": [
                {
                    "id": str,
                    "name": str,
                    "description": str
                },
                ...
            ]
        }
    """
    voices_info = [
        {"id": "alloy", "name": "Alloy", "description": "Neutral, versatile voice"},
        {"id": "echo", "name": "Echo", "description": "Clear, articulate voice"},
        {"id": "fable", "name": "Fable", "description": "Warm, storytelling voice"},
        {"id": "onyx", "name": "Onyx", "description": "Deep, resonant voice"},
        {"id": "nova", "name": "Nova", "description": "Bright, energetic voice"},
        {"id": "shimmer", "name": "Shimmer", "description": "Crisp, professional voice"},
    ]
    
    return JSONResponse(content={
        "success": True,
        "voices": voices_info
    })

@router.get("/languages")
async def get_supported_languages():
    """
    Get list of supported STT languages
    
    Returns:
        JSON: {
            "success": bool,
            "languages": [
                {
                    "code": str,
                    "name": str
                },
                ...
            ]
        }
    """
    languages_info = [
        {"code": "en", "name": "English"},
        {"code": "es", "name": "Spanish"},
        {"code": "fr", "name": "French"},
        {"code": "de", "name": "German"},
        {"code": "it", "name": "Italian"},
        {"code": "ja", "name": "Japanese"},
        {"code": "ko", "name": "Korean"},
        {"code": "pt", "name": "Portuguese"},
        {"code": "zh", "name": "Chinese"},
    ]
    
    return JSONResponse(content={
        "success": True,
        "languages": languages_info
    })

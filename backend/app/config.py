import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.xmciknzwedtkkleslayn:THINKANDGROWRICH@aws-1-ap-south-1.pooler.supabase.com:5432/postgres")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", 8000))
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
YOLOV8_MODEL = os.getenv("YOLOV8_MODEL", "yolov8n.pt")
GAZE_DETECTION_ENABLED = os.getenv("GAZE_DETECTION_ENABLED", "True").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required for STT/TTS functionality")

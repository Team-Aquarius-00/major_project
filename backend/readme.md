# Backend Object Detection Service

FastAPI service for interview monitoring using YOLOv8 and OpenCV.

This backend exposes a single endpoint, `POST /detect`, that receives an image frame and returns detected classes plus simple rule-based violations.

## Features

- YOLOv8 object detection (`person`, `book`, `cell phone`)
- Face presence check using OpenCV Haar Cascade
- Violation scoring for interview monitoring
- CORS enabled for local frontend integration

## Folder Contents

- `main.py`: FastAPI app and detection logic
- `requirements.txt`: Python dependencies
- `yolov8n.pt`: YOLO model weights used by Ultralytics

## Requirements

- Python 3.10+
- pip
- Webcam/frame source from frontend

## Setup

1. Open a terminal in this folder.
2. Create and activate a virtual environment.
3. Install dependencies.

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Windows (PowerShell):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The service will be available at:

- API: `http://localhost:8000`
- Docs (Swagger): `http://localhost:8000/docs`

## API Contract

### `POST /detect`

Accepts `multipart/form-data` with one field:

- `file`: image frame (`jpg`, `jpeg`, `png`)

Example request with curl:

```bash
curl -X POST "http://localhost:8000/detect" \
	-H "accept: application/json" \
	-H "Content-Type: multipart/form-data" \
	-F "file=@sample.jpg;type=image/jpeg"
```

Example response:

```json
{
  "classes": ["person", "cell phone"],
  "person_count": 1,
  "phone_count": 1,
  "book_count": 0,
  "face_present": true,
  "violations": ["Phone detected"],
  "score": 30
}
```

## Scoring Rules

- `+40` if more than one person is detected
- `+30` if any cell phone is detected
- `+20` if any book is detected
- `+25` if no face is visible

Higher score indicates more potential interview violations.

## Frontend Integration

The Next.js route at `app/api/object-detection/route.ts` forwards frames to this backend using:

- `BACKEND_URL` (server-side env), default: `http://localhost:8000`

Make sure your root app `.env.local` contains:

```env
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Troubleshooting

- `ModuleNotFoundError`:
  - Activate the virtual environment and reinstall requirements.
- `Address already in use` on port 8000:
  - Run on another port, e.g. `--port 8001`, and update `BACKEND_URL`.
- `No such file or directory: yolov8n.pt`:
  - Ensure `yolov8n.pt` exists in this `backend` folder.
- Slow first request:
  - Initial model load can take time; subsequent requests are faster.

## Notes

- CORS is currently open (`allow_origins=["*"]`) for development.
- For production, restrict CORS origins and consider authentication/rate-limiting.

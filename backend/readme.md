# Backend Object + Gaze Detection Service

FastAPI service for interview monitoring using YOLOv8, OpenCV, and MediaPipe.

This backend exposes a single endpoint, `POST /detect`, that receives an image frame and returns object detections, hybrid gaze tracking signals, and rule-based violations.

## Features

- YOLOv8 object detection (`person`, `book`, `cell phone`)
- Face presence check using OpenCV Haar Cascade
- Hybrid gaze tracking:
  - MediaPipe Face Mesh for facial landmarks + coarse head pose
  - MediaPipe Iris landmarks for gaze direction estimation
- Violation scoring for interview monitoring
- Snapshot evidence storage when non-person objects are detected
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
  "gaze": {
    "direction": "center",
    "is_focused": true,
    "confidence": 0.83,
    "method": "mediapipe",
    "head_centered": true
  },
  "head_pose": {
    "yaw": 4.2,
    "pitch": -2.1,
    "roll": 1.4
  },
  "violations": ["Phone detected"],
  "score": 30,
  "snapshot_saved": true,
  "snapshot_url": "/snapshots/20260331T121530123456_ab12cd34.jpg",
  "snapshot_full_url": "http://localhost:8000/snapshots/20260331T121530123456_ab12cd34.jpg",
  "snapshot_classes": ["cell phone"]
}
```

## Scoring Rules

- `+40` if more than one person is detected
- `+30` if any cell phone is detected
- `+20` if any book is detected
- `+25` if no face is visible
- `+10` if gaze/head are not centered

Higher score indicates more potential interview violations.

## Gaze Tracking Details

- `gaze.direction`: estimated eye direction (`left`, `right`, `up`, `down`, `center`, `unknown`)
- `gaze.is_focused`: true when single person, head is centered, and iris direction is centered
- `gaze.confidence`: confidence of gaze estimate
- `head_pose`: coarse Euler angles (yaw, pitch, roll) from Face Mesh landmarks

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
- Saved evidence images are written under `backend/snapshots/` and served via `/snapshots/*`.

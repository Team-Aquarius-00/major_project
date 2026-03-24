# FastAPI Interview Monitoring Backend

A comprehensive backend service for monitoring interview sessions with real-time gaze tracking, object detection, and tab switching alerts.

## Features

- ✅ **Real-time WebSocket Alerts**: Stream gaze detection, tab switch, and object detection alerts to the frontend
- 👀 **Gaze Tracking**: Eye gaze direction detection using MediaPipe
- 📱 **Object Detection**: YOLOv8n-based detection for phones, multiple people, etc.
- 📑 **Tab Monitoring**: Track and alert on tab switches and window focus events
- 💾 **Database Integration**: Save interview results to PostgreSQL via Prisma
- 🔄 **Session Management**: Start, pause, resume, and complete interview sessions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  - WebSocket client connected to /ws/alerts/{interview_id} │
│  - Sends gaze, tab, and object detection data              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP + WebSocket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ WebSocket Manager (Connection Management)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Alert Manager (Alert Storage & Retrieval)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ Gaze Tracker │ Object       │ Interview Monitor    │    │
│  │ (MediaPipe)  │ Detector     │ (Alert Generation)   │    │
│  │              │ (YOLOv8n)    │                      │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Database Service (HTTP to Next.js API)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP (Data Persistence)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Next.js API Routes (Prisma Integration)            │
├─────────────────────────────────────────────────────────────┤
│ - /api/gaze                                                 │
│ - /api/object-detection                                    │
│ - /interview/{interview_id}/results                         │
│ - /tab-monitoring                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Prisma Client
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            PostgreSQL Database                              │
│ - Interview table (with tracking JSON field)               │
│ - Users table                                              │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Python 3.9+
- Node.js 18+ (for frontend)
- PostgreSQL database
- Webcam (for gaze tracking)

### Backend Setup

1. **Clone and Navigate**

```bash
cd backend
```

2. **Create Virtual Environment**

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Dependencies**

```bash
pip install -r requirements.txt
```

4. **Configure Environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Key Environment Variables**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/interview_db

# Frontend
FRONTEND_URL=http://localhost:3000

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=False

# Models
YOLOV8_MODEL=yolov8n.pt
GAZE_DETECTION_ENABLED=True
```

6. **Run Server**

```bash
python -m app.main
# or use the startup script
bash start.sh  # Linux/Mac
start.bat      # Windows
```

The server will start at `http://localhost:8000`

## API Endpoints

### WebSocket (Real-time Alerts)

**Connect to Alerts Stream**

```
WS ws://localhost:8000/ws/alerts/{interview_id}
```

**Message Types Received:**

```json
{
  "type": "alert",
  "data": {
    "type": "gaze_alert|tab_switch|object_detected",
    "message": "Looking left",
    "severity": "high|medium|low",
    "data": {}
  },
  "timestamp": "2024-03-24T10:30:00Z"
}
```

**Send Heartbeat:**

```json
{
  "type": "heartbeat"
}
```

### REST API Endpoints

#### Tab Switch Monitoring

```http
POST /api/tab-switch
Content-Type: application/json

{
  "interview_id": "interview_123",
  "candidate_id": "candidate_456",
  "tab_title": "Google",
  "tab_url": "https://google.com",
  "time_spent": 5000,
  "event_type": "switch_away",
  "timestamp": "2024-03-24T10:30:00Z"
}
```

#### Gaze Data

```http
POST /api/gaze-data
Content-Type: application/json

{
  "interview_id": "interview_123",
  "candidate_id": "candidate_456",
  "gaze_x": 0.45,
  "gaze_y": 0.35,
  "gaze_direction": "left",
  "confidence": 0.92,
  "is_looking_at_screen": false,
  "timestamp": "2024-03-24T10:30:00Z"
}
```

#### Object Detection

```http
POST /api/object-detection
Content-Type: application/json

{
  "interview_id": "interview_123",
  "candidate_id": "candidate_456",
  "detected_objects": [
    {
      "class": "cell phone",
      "confidence": 0.95,
      "bbox": {
        "x1": 100,
        "y1": 100,
        "x2": 200,
        "y2": 200
      }
    }
  ],
  "timestamp": "2024-03-24T10:30:00Z"
}
```

#### Interview Session Management

```http
POST /api/interview/session/start
Content-Type: application/json

{
  "interview_id": "interview_123",
  "candidate_id": "candidate_456",
  "candidate_name": "John Doe",
  "job_position": "Software Engineer",
  "start_time": "2024-03-24T10:30:00Z",
  "status": "active"
}
```

#### Complete Interview

```http
POST /api/interview/{interview_id}/complete
Content-Type: application/json

{
  "feedback": { /* feedback data */ },
  "scoring": { /* scoring data */ },
  "tracking": { /* tracking metrics */ }
}
```

## Frontend Integration

### 1. Environment Configuration

Add to `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
```

### 2. Use WebSocket Hook

```tsx
import { useInterviewAlerts } from '@/hooks/useInterviewAlerts'

export function InterviewPage({ interviewId }) {
  const { alerts, isConnected, clearAlerts } = useInterviewAlerts(
    interviewId,
    true, // enabled
  )

  return (
    <>
      <InterviewAlerts alerts={alerts} interviewId={interviewId} />
      {/* Rest of your interview component */}
    </>
  )
}
```

### 3. Send Data from Frontend

```tsx
// Send gaze data
const sendGazeData = async (gazeData) => {
  await fetch('/api/gaze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interview_id: interviewId,
      candidate_id: candidateId,
      gaze_x: gazeData.x,
      gaze_y: gazeData.y,
      gaze_direction: gazeData.direction,
      confidence: gazeData.confidence,
      is_looking_at_screen: gazeData.onScreen,
      timestamp: new Date().toISOString(),
    }),
  })
}
```

## Alert Types and Severity

### Gaze Alerts

- **Type**: `gaze_alert`
- **Triggers**: When user looks away from screen for >5 seconds
- **Severity**: High (if >10s), Medium (if 5-10s)
- **Message**: "Looking {direction}" (left, right, up, down)

### Tab Switch Alerts

- **Type**: `tab_switch`
- **Triggers**: When user switches tabs/windows for >2 seconds
- **Severity**: High
- **Message**: "Switched to {tab_title}"

### Object Detection Alerts

- **Type**: `object_detected`
- **Triggers**: Phone detected (high), Multiple people detected (medium)
- **Severity**: High for phone, Medium for multiple people
- **Message**: "📱 Phone detected" or "👥 Multiple people detected"

## Data Storage

Interview results are stored in the `Interview` table with:

- `id`: Primary key
- `interview_id`: Unique interview identifier
- `tracking`: JSON object containing all monitoring metrics
- `feedback`: Interview feedback/scoring
- `scoring`: Scoring metrics
- `completed`: Boolean completion status
- `created_at`: Timestamp

Example tracking JSON structure:

```json
{
  "gaze_alerts": [
    {
      "type": "gaze_alert",
      "message": "Looking left",
      "severity": "high",
      "timestamp": "2024-03-24T10:30:05Z",
      "data": {
        "direction": "left",
        "time_away": 5500,
        "confidence": 0.95
      }
    }
  ],
  "tab_switch_alerts": [
    {
      "type": "tab_switch",
      "message": "Switched to Google",
      "severity": "high",
      "timestamp": "2024-03-24T10:32:00Z",
      "data": {
        "tab_url": "https://google.com",
        "time_spent": 3000,
        "event_type": "switch_away"
      }
    }
  ],
  "object_detection_alerts": [],
  "total_focus_time": 1800000,
  "total_distractions": 3,
  "gaze_away_time": 15000,
  "tab_switches": 2
}
```

## Running Both Services

### Terminal 1 - Frontend

```bash
cd /path/to/project
npm run dev
# Runs at http://localhost:3000
```

### Terminal 2 - Backend

```bash
cd /path/to/project/backend
source venv/bin/activate
python -m app.main
# Runs at http://localhost:8000
```

## Troubleshooting

### WebSocket Connection Issues

- Check that backend is running on correct port (8000)
- Verify FRONTEND_URL in backend .env
- Check browser console for WebSocket errors

### Gaze Tracking Not Working

- Ensure webcam access is granted
- Check MediaPipe dependencies are installed
- Verify camera is working: `python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"`

### Object Detection Slow

- YOLOv8n model loads on first detection (takes ~5-10 seconds)
- Consider running on GPU for real-time performance
- Use smaller model (yolov8n is already the smallest)

### Database Connection Issues

- Verify DATABASE_URL is correct in .env
- Check PostgreSQL server is running
- Ensure Prisma migrations are applied

## Performance Optimization

1. **Gaze Tracking**: Reduce sampling rate if needed (default 1 second)
2. **Object Detection**: Process every Nth frame instead of every frame
3. **WebSocket**: Batch alerts if sending too frequently
4. **Database**: Add indexes on `interview_id` field

## Security Considerations

1. Add authentication to API endpoints (JWT tokens)
2. Validate and sanitize all inputs
3. Add rate limiting to prevent spam
4. Use HTTPS in production
5. Add CORS validation
6. Implement request signing for sensitive data

## License

MIT

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

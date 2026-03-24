# Complete Integration Guide: Interview Monitoring System

## Overview

This document provides a complete guide to the integrated interview monitoring system with:

- ✅ FastAPI Backend (Python) for real-time monitoring
- ✅ Next.js Frontend (TypeScript/React) for UI
- ✅ PostgreSQL Database (via Prisma) for data persistence
- ✅ Real-time WebSocket alerts
- ✅ Gaze tracking using MediaPipe
- ✅ Object detection with YOLOv8n
- ✅ Tab switching detection

## Architecture Overview

```
┌──────────────────────────┐
│    Interview Frontend     │
│    (Next.js/React)       │
│  - Interview UI          │
│  - Alert Display         │
│  - WebSocket Client      │
└────────────┬─────────────┘
             │ HTTP + WebSocket
             ↓
┌──────────────────────────┐
│   FastAPI Backend        │
│ (Python)                 │
│  - WebSocket Server      │
│  - Gaze Tracking         │
│  - Object Detection      │
│  - Alert Generation      │
└────────────┬─────────────┘
             │ HTTP
             ↓
┌──────────────────────────┐
│  Next.js API Routes      │
│ (Data Aggregation)       │
└────────────┬─────────────┘
             │ Prisma
             ↓
┌──────────────────────────┐
│  PostgreSQL Database     │
│ (Data Persistence)       │
└──────────────────────────┘
```

## Project Structure

```
major_project/
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── gaze/route.ts                    (NEW)
│   │   │   ├── object-detection/route.ts        (NEW)
│   │   │   └── interview/[interview_id]/results/route.ts (NEW)
│   │   ├── (main)/
│   │   │   └── interview/
│   │   │       └── [interview_id]/
│   │   │           └── start/page.jsx
│   │   └── layout.tsx
│   ├── hooks/
│   │   └── useInterviewAlerts.ts               (NEW)
│   ├── components/
│   │   └── InterviewAlerts.tsx                 (NEW)
│   ├── services/
│   │   └── interviewTrackingService.js         (UPDATED)
│   ├── .env.local.example                      (NEW)
│   └── next.config.ts
│
└── backend/
    ├── app/
    │   ├── main.py                              (FastAPI app)
    │   ├── config.py                            (Configuration)
    │   ├── models/
    │   │   └── schemas.py                       (Pydantic models)
    │   ├── services/
    │   │   ├── gaze_tracker.py                  (MediaPipe)
    │   │   ├── object_detector.py               (YOLOv8n)
    │   │   ├── interview_monitor.py             (Alert logic)
    │   │   ├── database_service.py              (Prisma integration)
    │   │   └── alert_manager.py                 (Alert storage)
    │   └── routes/
    │       ├── websocket_routes.py              (WebSocket)
    │       ├── monitoring_routes.py             (Alerts)
    │       └── interview_routes.py              (Session mgmt)
    ├── requirements.txt                         (Dependencies)
    ├── .env.example                             (Configuration template)
    ├── start.sh / start.bat                     (Startup scripts)
    └── README.md                                (Full documentation)
```

## Setup Instructions

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update .env with your configuration
# - DATABASE_URL to your PostgreSQL connection
# - FRONTEND_URL to http://localhost:3000
```

### Step 2: Frontend Setup

```bash
# Navigate to project root
cd ..

# Update .env.local
cp .env.local.example .env.local

# Key additions to .env.local:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
# BACKEND_URL=http://localhost:8000

# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

### Step 3: Start Services

**Terminal 1 - Backend**

```bash
cd backend
source venv/bin/activate
python -m app.main
# Server runs at http://localhost:8000
```

**Terminal 2 - Frontend**

```bash
npm run dev
# Frontend runs at http://localhost:3000
```

## How It Works

### 1. Interview Session Flow

```
User Creates Interview
        ↓
Frontend connects WebSocket to /ws/alerts/{interview_id}
        ↓
Backend ConnectionManager accepts connection
        ↓
Interview Starts
        ↓
Frontend sends gaze/tab/detection data to /api/{tracking_type}
        ↓
Next.js API forwards data to FastAPI backend
        ↓
Backend processes and generates alerts
        ↓
Backend broadcasts alert via WebSocket
        ↓
Frontend receives alert and displays notification
```

### 2. Gaze Tracking Flow

```
Frontend Eye Movement Detected
        ↓
POST /api/gaze (Next.js)
        ↓
Forward to FastAPI: POST /api/gaze-data
        ↓
GazeTracker.process_frame()
        ↓
InterviewMonitor.process_gaze_data()
        ↓
Generate "gaze_alert" if looking away
        ↓
Broadcast via WebSocket
        ↓
Frontend displays: "Looking left" alert
        ↓
Store in Interview.tracking JSON
```

### 3. Tab Monitoring Flow

```
User Switches Tab (blur/focus event)
        ↓
POST /api/gaze (Next.js) with tab data
        ↓
Forward to FastAPI: POST /api/tab-switch
        ↓
InterviewMonitor.process_tab_switch()
        ↓
Generate "tab_switch" alert
        ↓
Broadcast via WebSocket
        ↓
Frontend displays: "Switched to {tab_name}" alert
        ↓
Store in Interview.tracking JSON
```

### 4. Object Detection Flow

```
Frame captured from camera
        ↓
POST /api/object-detection (Next.js)
        ↓
Forward to FastAPI: POST /api/object-detection
        ↓
ObjectDetector.detect_objects() (YOLOv8n)
        ↓
InterviewMonitor.process_object_detection()
        ↓
Generate alerts for phone/multiple people
        ↓
Broadcast via WebSocket
        ↓
Frontend displays: "📱 Phone detected" alert
        ↓
Store in Interview.tracking JSON
```

## API Communication

### Next.js ↔ FastAPI Communication

All frontend tracking data flows through Next.js API routes, which then forward to FastAPI:

```
Frontend                Next.js API              FastAPI Backend
  │                        │                          │
  ├─ POST /api/gaze ──────→ ├─ Forward data ────────→ │
  │                        │                      process
  │                        │ ← Broadcast alert ←──┤
  │ ← Receive via WS ←─────┤                          │
  │                        │                          │
```

### WebSocket Connection Details

**Connection URL**: `ws://localhost:8000/ws/alerts/{interview_id}`

**Client sends**:

```json
{
  "type": "heartbeat" // Keep connection alive
}
```

**Server sends**:

```json
{
  "type": "alert",
  "data": {
    "type": "gaze_alert|tab_switch|object_detected",
    "message": "Alert message",
    "severity": "high|medium|low",
    "data": {
      /* specific data */
    }
  },
  "timestamp": "ISO-8601"
}
```

## Database Schema

### Interview Table

```sql
CREATE TABLE "Interview" (
  id SERIAL PRIMARY KEY,
  interview_id VARCHAR UNIQUE,
  job_position VARCHAR,
  job_description VARCHAR,
  duration VARCHAR,
  questionList JSONB,
  userEmail VARCHAR,
  completed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  feedback JSONB,
  scoring JSONB,
  tracking JSONB,  -- Contains all monitoring data
  type TEXT[],
  user_id INT
);
```

### Tracking JSON Structure

```javascript
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
  "tab_switch_alerts": [],
  "object_detection_alerts": [],
  "total_focus_time": 1800000,
  "total_distractions": 3,
  "gaze_away_time": 15000,
  "tab_switches": 2
}
```

## Frontend Components

### useInterviewAlerts Hook

```typescript
const { alerts, isConnected, clearAlerts, getAlertsByType } =
  useInterviewAlerts(interviewId, true)

// Returns:
// - alerts: Alert[] - All received alerts
// - isConnected: boolean - WebSocket connection status
// - clearAlerts: () => void - Clear alerts
// - getAlertsByType: (type: string) => Alert[] - Filter alerts
```

### InterviewAlerts Component

```typescript
<InterviewAlerts alerts={alerts} interviewId={interviewId} />

// Displays:
// - Summary counts (gaze, tabs, phone, people)
// - Recent alerts with timestamps
// - Color-coded severity indicators
// - Toast notifications for new alerts
```

## Event Types and Handlers

### Gaze Events

- **Type**: `gaze_alert`
- **Triggers**: Eyes away from screen >5 seconds
- **Message**: "Looking {left|right|up|down|away}"
- **Stored in**: `tracking.gaze_alerts[]`

### Tab Events

- **Type**: `tab_switch`
- **Triggers**: Tab switch or window blur >2 seconds
- **Message**: "Switched to {tab_title}"
- **Stored in**: `tracking.tab_switch_alerts[]`

### Object Detection Events

- **Type**: `object_detected`
- **Objects**: Phone, Multiple people
- **Message**: "📱 Phone detected" or "👥 Multiple people detected"
- **Stored in**: `tracking.object_detection_alerts[]`

## Configuration

### Backend (.env)

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/interview_db

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=True

# Models
YOLOV8_MODEL=yolov8n.pt
GAZE_DETECTION_ENABLED=True
```

### Frontend (.env.local)

```env
# Backend URL (must match backend FRONTEND_URL)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000

# Other configs...
```

## Troubleshooting

### WebSocket Connection Fails

1. Ensure backend is running: `http://localhost:8000/health`
2. Check browser console for error details
3. Verify CORS settings in backend (should allow frontend origin)
4. Ensure interview_id is valid

### No Alerts Appearing

1. Check frontend WebSocket is connected (`useInterviewAlerts` returns `isConnected: true`)
2. Verify data is being sent to `/api/gaze`, `/api/object-detection`, etc.
3. Check backend logs for alert generation
4. Ensure alert thresholds are being met

### Database Not Storing Data

1. Verify DATABASE_URL is correct
2. Check Prisma migrations: `npx prisma migrate status`
3. Ensure `tracking` field in Interview table can accept JSON

### Gaze Tracking Not Working

1. Check webcam permissions granted
2. Verify MediaPipe dependencies installed: `python -c "import mediapipe"`
3. Test camera: `python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"`

### Object Detection Slow

1. First detection takes 5-10 seconds to load model
2. Run on GPU for better performance (update requirements.txt)
3. Use for every Nth frame instead of every frame

## Production Considerations

1. **Security**
   - Add JWT authentication to all endpoints
   - Validate and sanitize all inputs
   - Use HTTPS instead of HTTP
   - Add rate limiting

2. **Performance**
   - Deploy FastAPI backend separately (e.g., Heroku, AWS EC2)
   - Use GPU instance for object detection
   - Implement alert batching
   - Add database indexing

3. **Monitoring**
   - Add logging (Python logging module)
   - Monitor WebSocket connections
   - Track alert generation rates
   - Monitor database performance

4. **Scalability**
   - Use Redis for alert caching
   - Implement message queue for async processing
   - Use load balancing for multiple backend instances
   - Consider microservices architecture

## Next Steps

1. ✅ **Backend running**: Test at `http://localhost:8000/health`
2. ✅ **Frontend running**: Test at `http://localhost:3000`
3. ✅ **WebSocket connected**: Check browser console
4. ✅ **Data flowing**: Monitor alert console and database
5. 🔄 **Optimize**: Adjust alert thresholds for your use case
6. 🔄 **Secure**: Add authentication before production
7. 🔄 **Deploy**: Set up infrastructure for production

## Support & Documentation

- Backend docs: `backend/README.md`
- Frontend hook: `hooks/useInterviewAlerts.ts`
- Components: `components/InterviewAlerts.tsx`
- Services: `services/interviewTrackingService.js`

For issues or questions, refer to the component documentation or create an issue in the repository.

# Interview Monitoring System

A complete, integrated interview monitoring solution with real-time alerts, gaze tracking, object detection, and tab monitoring.

## What's New ✨

### 🚀 Complete Backend Integration

- **FastAPI Backend** with WebSocket real-time alerts
- **YOLOv8n Object Detection** for phone and people detection
- **MediaPipe Gaze Tracking** for eye movement monitoring
- **Intelligent Alert System** with configurable thresholds
- **Database Integration** with Prisma/PostgreSQL

### 📡 Real-Time Capabilities

- WebSocket connection with automatic reconnection
- Live alert streaming to candidates
- Heart-beat monitoring for connection health
- Alert batching and management

### 🎯 Monitoring Features

- **Gaze Tracking**: Detects when candidate looks away
- **Tab Switching**: Alerts on window/tab switching
- **Object Detection**: Identifies phones and multiple people
- **Session Management**: Start, pause, resume, complete interviews
- **Results Storage**: All metrics saved to database

## Quick Links

- 🚀 **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- 📖 **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Complete architecture & setup
- 📚 **[backend/README.md](./backend/README.md)** - Detailed backend documentation

## Project Structure

```
major_project/
├── backend/                          # FastAPI backend (NEW)
│   ├── app/
│   │   ├── main.py                  # FastAPI app
│   │   ├── config.py                # Configuration
│   │   ├── models/schemas.py        # Data models
│   │   ├── services/                # Core services
│   │   │   ├── gaze_tracker.py      # Eye tracking
│   │   │   ├── object_detector.py   # YOLOv8n
│   │   │   ├── interview_monitor.py # Alert logic
│   │   │   └── database_service.py  # DB integration
│   │   └── routes/                  # API endpoints
│   │       ├── websocket_routes.py  # WebSocket
│   │       ├── monitoring_routes.py # Monitoring APIs
│   │       └── interview_routes.py  # Session mgmt
│   ├── requirements.txt             # Python dependencies
│   └── README.md                    # Backend docs
│
├── app/api/                         # API routes (UPDATED)
│   ├── gaze/route.ts               # Forward gaze data
│   └── object-detection/route.ts   # Forward detection
│
├── hooks/
│   └── useInterviewAlerts.ts       # WebSocket hook (NEW)
│
├── components/
│   └── InterviewAlerts.tsx         # Alert display (NEW)
│
├── INTEGRATION_GUIDE.md            # Full integration guide (NEW)
├── QUICKSTART.md                   # Quick start (NEW)
└── .env.local.example              # Environment template (NEW)
```

## Key Features

### 🎥 Gaze Tracking

```
Eye Movement Detection → Gaze Direction Classification → Alert Generation
Using MediaPipe Face Mesh for real-time eye tracking
```

### 📱 Object Detection

```
Video Frame → YOLOv8n Detection → Object Classification → Alert
Detects: phones, multiple people, and other objects
```

### 📑 Tab/Window Monitoring

```
Focus Events → Tab Switch Detection → Time Tracking → Alert
Monitors: blur, focus, visibility change events
```

### 🔔 Real-Time Alerts

```
Data Collection → Backend Processing → WebSocket Broadcast → Frontend Display
Uses WebSocket for instant, bidirectional communication
```

## System Architecture

```
┌─────────────────────┐
│  Interview Page     │
│   (Next.js)        │
└──────────┬──────────┘
           │
    HTTP + WebSocket
           │
┌──────────▼──────────┐
│ FastAPI Backend     │
│  - Gaze Tracking    │
│  - Object Detection │
│  - Alert Manager    │
└──────────┬──────────┘
           │
          HTTP
           │
┌──────────▼──────────┐
│ Next.js API Routes  │
│ (Data Bridge)       │
└──────────┬──────────┘
           │
        Prisma
           │
┌──────────▼──────────┐
│    PostgreSQL       │
│ (Interview Data)    │
└─────────────────────┘
```

## Alert Types

| Type            | Message      | Severity | Example                       |
| --------------- | ------------ | -------- | ----------------------------- |
| Gaze Alert      | Looking away | High     | "Looking left"                |
| Tab Switch      | Tab changed  | High     | "Switched to Google"          |
| Phone Detected  | Object found | High     | "📱 Phone detected"           |
| Multiple People | Distraction  | Medium   | "👥 Multiple people detected" |

## Getting Started

### 1. Quick Start (5 minutes)

See [QUICKSTART.md](./QUICKSTART.md) for minimal setup

### 2. Full Setup (10 minutes)

Follow [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for complete configuration

### 3. Backend Details

Check [backend/README.md](./backend/README.md) for API documentation

## Requirements

- Python 3.9+
- Node.js 18+
- PostgreSQL
- Webcam (for gaze tracking)

## Installation

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.main
```

### Frontend

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

## Environment Setup

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/interview_db
FRONTEND_URL=http://localhost:3000
SERVER_PORT=8000
YOLOV8_MODEL=yolov8n.pt
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
```

## Endpoints

### WebSocket

```
ws://localhost:8000/ws/alerts/{interview_id}
```

### REST APIs

```
POST /api/tab-switch          # Tab monitoring
POST /api/gaze-data           # Gaze data
POST /api/object-detection    # Object detection
POST /api/interview/session/start    # Start session
POST /api/interview/{id}/complete    # Complete interview
```

## Data Flow

1. **Candidate takes interview** → Frontend collects data
2. **Data sent to Next.js API** → /api/gaze, /api/object-detection, etc.
3. **Next.js forwards to FastAPI** → Backend processes
4. **Backend processes data** → Generates alerts
5. **Alerts broadcast via WebSocket** → Frontend displays
6. **Data saved to database** → Prisma/PostgreSQL stores

## Monitoring Metrics

Stored in `Interview.tracking` JSON:

- Gaze alerts (direction, duration, confidence)
- Tab switch alerts (URL, time spent)
- Object detection alerts (detected objects)
- Total focus time
- Distraction count
- Alert summary statistics

## Database Storage

All interview data stored in PostgreSQL via Prisma:

```sql
Interview.tracking: {
  gaze_alerts: [...],
  tab_switch_alerts: [...],
  object_detection_alerts: [...],
  total_focus_time: number,
  total_distractions: number
}
```

## Deployment

### Development

```bash
# Terminal 1
cd backend && python -m app.main

# Terminal 2
npm run dev
```

### Production

- Deploy FastAPI to dedicated server (AWS, Heroku, DigitalOcean)
- Use PostgreSQL managed service
- Enable HTTPS/SSL
- Add authentication/authorization
- Configure CORS properly

## Documentation

- [QUICKSTART.md](./QUICKSTART.md) - 5-minute quick start
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Complete integration details
- [backend/README.md](./backend/README.md) - Backend API documentation
- Component comments in source files

## Support

For issues or questions:

1. Check the relevant documentation file
2. Review component comments
3. Check backend logs: `tail -f /logs/backend.log`
4. Create an issue with:
   - Environment details
   - Error messages
   - Steps to reproduce

## License

MIT

## What's Changed

### New Files Created

- ✅ Complete FastAPI backend with all services
- ✅ WebSocket integration for real-time alerts
- ✅ React hook for WebSocket alerts (`useInterviewAlerts`)
- ✅ Alert display component (`InterviewAlerts`)
- ✅ API bridge routes for data forwarding
- ✅ Comprehensive documentation

### Updated Files

- ✅ `services/interviewTrackingService.js` - Now forwards data to backend

### Configuration Files

- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `backend/.env.example` - Backend configuration template
- ✅ `.env.local.example` - Frontend configuration template

---

**Ready to go?** Start with [QUICKSTART.md](./QUICKSTART.md)! 🚀

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

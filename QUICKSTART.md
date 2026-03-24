# Quick Start Guide

## Get Running in 5 Minutes

### Prerequisites

- Python 3.9+ installed
- Node.js 18+ installed
- PostgreSQL running (or connection string)

### Step 1: Backend Setup (Terminal 1)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env - set DATABASE_URL and FRONTEND_URL
python -m app.main
```

✅ Backend running at `http://localhost:8000`

### Step 2: Frontend Setup (Terminal 2)

```bash
# In project root
cp .env.local.example .env.local
# Edit .env.local - ensure NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
npm install  # if needed
npm run dev
```

✅ Frontend running at `http://localhost:3000`

### Step 3: Test the Integration

1. Open interview page in browser
2. Open browser DevTools (F12) → Console
3. Should see: "WebSocket connected" message
4. Simulate alert by modifying `interviewTrackingService.js` to send test data

## What's Included

### 🎯 Backend (FastAPI)

- **WebSocket**: Real-time alert streaming at `/ws/alerts/{interview_id}`
- **Gaze Tracking**: Eye movement detection using MediaPipe
- **Object Detection**: YOLOv8n for phone/people detection
- **Rest APIs**: Tab monitoring, gaze data, object detection endpoints
- **Alert Manager**: Intelligent alert generation and storage
- **Database Service**: Integration with Next.js Prisma API

### 📱 Frontend Components

- **useInterviewAlerts Hook**: WebSocket connection management
- **InterviewAlerts Component**: Alert display UI
- **API Bridges**: Routes forwarding data to FastAPI backend
- **Updated Tracking Service**: Sends data to backend

### 💾 Database

- Interview tracking stored in `Interview.tracking` JSON field
- Automatic schema created by Prisma

## Alert Types

| Alert Type        | Trigger        | Severity | Example              |
| ----------------- | -------------- | -------- | -------------------- |
| `gaze_alert`      | Eyes away >5s  | High     | "Looking left"       |
| `tab_switch`      | Tab switch >2s | High     | "Switched to Google" |
| `object_detected` | Phone/people   | High/Med | "📱 Phone detected"  |

## Key Files to Know

**Backend**:

- `backend/app/main.py` - FastAPI application
- `backend/app/services/gaze_tracker.py` - Eye tracking
- `backend/app/services/object_detector.py` - YOLOv8n
- `backend/app/routes/websocket_routes.py` - Real-time alerts

**Frontend**:

- `hooks/useInterviewAlerts.ts` - WebSocket hook
- `components/InterviewAlerts.tsx` - Alert display
- `services/interviewTrackingService.js` - Data collection
- `app/api/gaze/route.ts` - API bridge routes

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/interview_db
FRONTEND_URL=http://localhost:3000
SERVER_PORT=8000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Common Issues

**Q: WebSocket won't connect?**
A: Check backend is running, verify `NEXT_PUBLIC_BACKEND_URL` is correct

**Q: No alerts showing?**
A: Ensure gaze/tab data is being sent, check backend logs

**Q: Database not storing data?**
A: Run `npx prisma migrate deploy` to apply migrations

## Next Steps

1. ✅ **Read Full Guide**: Check `INTEGRATION_GUIDE.md`
2. ✅ **Backend Docs**: See `backend/README.md`
3. 🔄 **Customize Thresholds**: Adjust alert triggers in `backend/app/services/interview_monitor.py`
4. 🔄 **Add Authentication**: Implement JWT tokens for security
5. 🔄 **Deploy**: Move to production infrastructure

## Support

- Full integration guide: `INTEGRATION_GUIDE.md`
- Backend documentation: `backend/README.md`
- Code comments in components and services

---

**Congratulations!** Your interview monitoring system is now running with real-time alerts! 🎉

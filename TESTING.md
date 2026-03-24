# Testing & Verification Guide

This guide helps you verify that the interview monitoring system is working correctly.

## Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- PostgreSQL database connected

## Manual Testing

### 1. Backend Health Check

```bash
# Test backend is running
curl http://localhost:8000/

# Response should be:
# {
#   "message": "Interview Monitoring Backend",
#   "version": "1.0.0",
#   "status": "active"
# }

# Health check
curl http://localhost:8000/health

# Response should be:
# {
#   "status": "healthy",
#   "service": "interview-monitoring-api"
# }
```

### 2. WebSocket Connection Test

```bash
# Using websocat (install with: cargo install websocat)
websocat ws://localhost:8000/ws/alerts/test_interview_123

# Should see connection accepted
# Send heartbeat:
{"type": "heartbeat"}

# Should receive:
# {"type":"heartbeat_ack","timestamp":"2024-03-24T10:30:00Z"}
```

### 3. API Endpoint Tests

#### Test Tab Switch Alert

```bash
curl -X POST http://localhost:8000/api/tab-switch \
  -H "Content-Type: application/json" \
  -d '{
    "interview_id": "test_123",
    "candidate_id": "candidate_456",
    "tab_title": "Google",
    "tab_url": "https://google.com",
    "time_spent": 5000,
    "event_type": "switch_away",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Response should be:
# {
#   "success": true,
#   "message": "Tab switch recorded",
#   "alert_sent": true
# }
```

#### Test Gaze Data

```bash
curl -X POST http://localhost:8000/api/gaze-data \
  -H "Content-Type: application/json" \
  -d '{
    "interview_id": "test_123",
    "candidate_id": "candidate_456",
    "gaze_x": 0.2,
    "gaze_y": 0.3,
    "gaze_direction": "left",
    "confidence": 0.95,
    "is_looking_at_screen": false,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Response:
# {
#   "success": true,
#   "message": "Gaze data recorded",
#   "alert_sent": true
# }
```

#### Test Object Detection

```bash
curl -X POST http://localhost:8000/api/object-detection \
  -H "Content-Type: application/json" \
  -d '{
    "interview_id": "test_123",
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
    "frame_id": 1,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

### 4. Interview Session Tests

```bash
# Start session
curl -X POST http://localhost:8000/api/interview/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "interview_id": "test_123",
    "candidate_id": "candidate_456",
    "candidate_name": "John Doe",
    "job_position": "Software Engineer",
    "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "status": "active"
  }'

# Get session details
curl http://localhost:8000/api/interview/test_123

# Complete session
curl -X POST http://localhost:8000/api/interview/test_123/complete \
  -H "Content-Type: application/json" \
  -d '{
    "feedback": {"overall": "Good"},
    "scoring": {"total": 85},
    "tracking": {"alerts": 3}
  }'
```

## Frontend Testing

### 1. WebSocket Hook Test

Add this to an interview page component:

```tsx
import { useInterviewAlerts } from '@/hooks/useInterviewAlerts'

export function TestComponent() {
  const { alerts, isConnected } = useInterviewAlerts('test_123', true)

  return (
    <div>
      <h2>
        WebSocket Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </h2>
      <h3>Total Alerts: {alerts.length}</h3>
      {alerts.map((alert, i) => (
        <p key={i}>
          {alert.message} - {alert.severity}
        </p>
      ))}
    </div>
  )
}
```

### 2. Alert Component Test

```tsx
import { InterviewAlerts } from '@/components/InterviewAlerts'
import { useInterviewAlerts } from '@/hooks/useInterviewAlerts'

export function TestPage() {
  const { alerts } = useInterviewAlerts('test_123', true)

  return <InterviewAlerts alerts={alerts} interviewId='test_123' />
}
```

### 3. Browser Console Tests

Open DevTools → Console and run:

```javascript
// Test localStorage
localStorage.setItem('test', 'value')
console.log('localStorage working:', localStorage.getItem('test'))

// Test fetch
fetch('http://localhost:8000/health')
  .then((r) => r.json())
  .then((d) => console.log('Backend connected:', d))
  .catch((e) => console.error('Backend error:', e))

// Test WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/alerts/test_123')
ws.onopen = () => console.log('✅ WebSocket connected')
ws.onclose = () => console.log('❌ WebSocket closed')
ws.onerror = (e) => console.error('WebSocket error:', e)
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data))
```

## Database Testing

### 1. Check Interview Table

```bash
# Connect to database
psql $DATABASE_URL

# List all interviews
SELECT id, interview_id, completed FROM "Interview" LIMIT 10;

# Check tracking data for specific interview
SELECT interview_id, tracking FROM "Interview"
WHERE interview_id = 'test_123';

# View alert count by type
SELECT
  interview_id,
  jsonb_array_length(tracking->'gaze_alerts') as gaze_alerts,
  jsonb_array_length(tracking->'tab_switch_alerts') as tab_alerts,
  jsonb_array_length(tracking->'object_detection_alerts') as detection_alerts
FROM "Interview"
WHERE tracking IS NOT NULL;
```

### 2. Verify Data Integrity

```bash
# Check for null tracking fields
SELECT id, interview_id FROM "Interview" WHERE tracking IS NULL;

# Check for valid JSON
SELECT interview_id FROM "Interview"
WHERE tracking::text ~ '^[^{}]*$';

# Count alerts per interview
SELECT interview_id,
  COALESCE(jsonb_array_length(tracking->'gaze_alerts'), 0) as total
FROM "Interview"
GROUP BY interview_id
ORDER BY total DESC;
```

## End-to-End Test Flow

### Complete Test Scenario

1. **Start Backend**

   ```bash
   cd backend
   source venv/bin/activate
   python -m app.main
   ✅ Verify: http://localhost:8000/health returns 200
   ```

2. **Start Frontend**

   ```bash
   npm run dev
   ✅ Verify: http://localhost:3000 loads successfully
   ```

3. **Create Interview Session**

   ```bash
   # Create new interview via API
   curl -X POST http://localhost:3000/api/interview \
     -H "Content-Type: application/json" \
     -d '{
       "interview_id": "end_to_end_test",
       "job_position": "Engineer",
       "candidate_name": "Test User"
     }'
   ```

4. **Connect WebSocket**

   ```javascript
   const ws = new WebSocket('ws://localhost:8000/ws/alerts/end_to_end_test')
   ws.onmessage = (e) => console.log('Alert:', e.data)
   ✅ Should see connection confirmation
   ```

5. **Send Test Data**

   ```bash
   # Simulate tab switch
   curl -X POST http://localhost:8000/api/tab-switch \
     -H "Content-Type: application/json" \
     -d '{"interview_id":"end_to_end_test",...}'
   ✅ Should see alert in WebSocket
   ```

6. **Verify Database**
   ```bash
   psql $DATABASE_URL -c \
     "SELECT tracking FROM "Interview" WHERE interview_id='end_to_end_test';"
   ✅ Should see tracking data with alerts
   ```

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench (macOS)
brew install httpd

# Test API endpoint
ab -n 1000 -c 10 http://localhost:8000/health

# Test with data
ab -p data.json -T application/json -n 100 -c 10 \
  http://localhost:8000/api/gaze-data
```

### WebSocket Load Test

```python
import asyncio
import websockets
import json

async def test_websocket_load():
    uris = [f'ws://localhost:8000/ws/alerts/test_{i}' for i in range(10)]

    async def connect(uri):
        async with websockets.connect(uri) as websocket:
            for _ in range(100):
                await websocket.send(json.dumps({"type": "heartbeat"}))
                await asyncio.sleep(0.1)

    await asyncio.gather(*[connect(uri) for uri in uris])

asyncio.run(test_websocket_load())
```

## Stress Testing

### Slow Network Test

Use Chrome DevTools:

1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Test alert delivery
4. ✅ Alerts should still deliver

### Memory Leak Test

Run for extended period:

```bash
# Monitor backend memory
watch -n 1 'ps aux | grep python'

# Monitor frontend memory
# Chrome DevTools → Memory tab → Take heap snapshots
```

## Automated Test Suite

Create test file: `tests/integrations.py`

```python
import pytest
import httpx
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_tab_switch_alert():
    response = client.post(
        "/api/tab-switch",
        json={
            "interview_id": "test_123",
            "candidate_id": "cand_456",
            "tab_title": "Google",
            "tab_url": "https://google.com",
            "time_spent": 5000,
            "event_type": "switch_away",
            "timestamp": "2024-03-24T10:00:00Z"
        }
    )
    assert response.status_code == 200
    assert response.json()["success"] == True

def test_gaze_alert():
    response = client.post(
        "/api/gaze-data",
        json={
            "interview_id": "test_123",
            "candidate_id": "cand_456",
            "gaze_x": 0.2,
            "gaze_y": 0.3,
            "gaze_direction": "left",
            "confidence": 0.95,
            "is_looking_at_screen": False,
            "timestamp": "2024-03-24T10:00:00Z"
        }
    )
    assert response.status_code == 200
    assert response.json()["success"] == True

# Run tests
# pytest tests/integrations.py -v
```

## Checklist

- [ ] Backend health check passes
- [ ] WebSocket connection successful
- [ ] Tab switch alert received
- [ ] Gaze alert received
- [ ] Object detection alert received
- [ ] Data saved to database
- [ ] Frontend displays alerts correctly
- [ ] No console errors
- [ ] No network errors
- [ ] Load test passed
- [ ] Memory usage stable
- [ ] Performance acceptable (<200ms)

## Troubleshooting Test Failures

### WebSocket Connection Failed

```bash
# Check backend is running
curl http://localhost:8000/health

# Check port not in use
lsof -i :8000

# Check firewall
sudo ufw status
```

### Database Connection Failed

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check migrations
npx prisma migrate status
```

### API Request Failed

```bash
# Check CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:8000/api/tab-switch

# Check request format
curl -v http://localhost:8000/api/tab-switch
```

---

For issues or questions, refer to the main documentation files or create an issue in the repository.

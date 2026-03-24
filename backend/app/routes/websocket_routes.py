import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
from typing import Dict, Set
from app.services.alert_manager import AlertManager
from app.models.schemas import WebSocketMessage

router = APIRouter(prefix="/ws", tags=["websocket"])

# Store active connections and alert manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.alert_manager = AlertManager()
    
    async def connect(self, interview_id: str, websocket: WebSocket):
        await websocket.accept()
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = set()
        self.active_connections[interview_id].add(websocket)
    
    async def disconnect(self, interview_id: str, websocket: WebSocket):
        self.active_connections[interview_id].discard(websocket)
        if not self.active_connections[interview_id]:
            del self.active_connections[interview_id]
    
    async def broadcast_alert(self, interview_id: str, alert: dict):
        """Broadcast alert to all connected clients for an interview"""
        if interview_id in self.active_connections:
            message = {
                "type": "alert",
                "data": alert,
                "timestamp": datetime.now().isoformat()
            }
            for connection in self.active_connections[interview_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending alert: {e}")
    
    async def broadcast_status(self, interview_id: str, status: dict):
        """Broadcast status update to all connected clients"""
        if interview_id in self.active_connections:
            message = {
                "type": "status",
                "data": status,
                "timestamp": datetime.now().isoformat()
            }
            for connection in self.active_connections[interview_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending status: {e}")


manager = ConnectionManager()


@router.websocket("/alerts/{interview_id}")
async def websocket_endpoint(interview_id: str, websocket: WebSocket):
    """
    WebSocket endpoint for real-time alert streaming
    """
    await manager.connect(interview_id, websocket)
    print(f"Client connected for interview: {interview_id}")
    
    try:
        while True:
            # Receive messages from client (heartbeat or commands)
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            if message_data.get("type") == "heartbeat":
                await websocket.send_json({
                    "type": "heartbeat_ack",
                    "timestamp": datetime.now().isoformat()
                })
            elif message_data.get("type") == "get_pending_alerts":
                alerts = manager.alert_manager.get_pending_alerts(interview_id)
                await websocket.send_json({
                    "type": "pending_alerts",
                    "data": alerts,
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        await manager.disconnect(interview_id, websocket)
        print(f"Client disconnected for interview: {interview_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await manager.disconnect(interview_id, websocket)

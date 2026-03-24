from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict, Any
from app.models.schemas import TabSwitchData, GazeData, ObjectDetectionData, AlertEvent
from app.services.database_service import DatabaseService
from app.routes.websocket_routes import manager

router = APIRouter(prefix="/api", tags=["monitoring"])
db_service = DatabaseService()


@router.post("/tab-switch")
async def log_tab_switch(tab_data: TabSwitchData):
    """
    Log a tab switch event
    """
    try:
        # Broadcast alert to WebSocket clients
        alert = {
            "interview_id": tab_data.interview_id,
            "type": "tab_switch",
            "message": f"Switched to: {tab_data.tab_title}",
            "severity": "high",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "tab_title": tab_data.tab_title,
                "tab_url": tab_data.tab_url,
                "time_spent": tab_data.time_spent,
                "event_type": tab_data.event_type
            }
        }
        
        await manager.broadcast_alert(tab_data.interview_id, alert)
        
        # Save to database
        await db_service.save_tab_monitoring_data(
            tab_data.interview_id,
            {
                "interviewId": tab_data.interview_id,
                "candidateId": tab_data.candidate_id,
                "tabData": {
                    "title": tab_data.tab_title,
                    "url": tab_data.tab_url,
                    "timeSpent": tab_data.time_spent,
                    "eventType": tab_data.event_type
                },
                "timestamp": tab_data.timestamp.isoformat()
            }
        )
        
        return {
            "success": True,
            "message": "Tab switch recorded",
            "alert_sent": True
        }
    
    except Exception as e:
        print(f"Error logging tab switch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gaze-data")
async def log_gaze_data(gaze_data: GazeData):
    """
    Log gaze tracking data
    """
    try:
        # Generate alert if looking away
        should_alert = False
        alert_message = ""
        
        if not gaze_data.is_looking_at_screen:
            should_alert = True
            alert_message = f"Looking {gaze_data.gaze_direction}"
        
        if should_alert:
            alert = {
                "interview_id": gaze_data.interview_id,
                "type": "gaze_alert",
                "message": alert_message,
                "severity": "high",
                "timestamp": datetime.now().isoformat(),
                "data": {
                    "direction": gaze_data.gaze_direction,
                    "confidence": gaze_data.confidence,
                    "looking_at_screen": gaze_data.is_looking_at_screen
                }
            }
            
            await manager.broadcast_alert(gaze_data.interview_id, alert)
        
        return {
            "success": True,
            "message": "Gaze data recorded",
            "alert_sent": should_alert
        }
    
    except Exception as e:
        print(f"Error logging gaze data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/object-detection")
async def log_object_detection(detection_data: ObjectDetectionData):
    """
    Log object detection results
    """
    try:
        # Check for specific alert conditions
        alerts_to_send = []
        
        for obj in detection_data.detected_objects:
            class_name = obj.get('class', '').lower()
            confidence = obj.get('confidence', 0)
            
            if confidence > 0.6:  # Only alert for confident detections
                if 'phone' in class_name:
                    alerts_to_send.append({
                        "type": "object_detected",
                        "message": "📱 Phone detected",
                        "severity": "high",
                        "object": "phone"
                    })
                elif 'person' in class_name:
                    # Count people
                    person_count = len([o for o in detection_data.detected_objects 
                                      if 'person' in o.get('class', '').lower()])
                    if person_count > 1:
                        alerts_to_send.append({
                            "type": "object_detected",
                            "message": f"👥 Multiple people detected ({person_count})",
                            "severity": "medium",
                            "object": "multiple_people"
                        })
        
        # Broadcast alerts
        for alert_template in alerts_to_send:
            alert = {
                "interview_id": detection_data.interview_id,
                "timestamp": datetime.now().isoformat(),
                **alert_template
            }
            await manager.broadcast_alert(detection_data.interview_id, alert)
        
        return {
            "success": True,
            "message": "Object detection recorded",
            "alerts_sent": len(alerts_to_send)
        }
    
    except Exception as e:
        print(f"Error logging object detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interview/{interview_id}/complete")
async def complete_interview(interview_id: str, results: Dict[str, Any]):
    """
    Mark interview as complete and save results
    """
    try:
        # Save results to database
        success = await db_service.save_interview_results(
            interview_id,
            results
        )
        
        # Broadcast completion status
        await manager.broadcast_status(interview_id, {
            "status": "completed",
            "message": "Interview completed successfully"
        })
        
        return {
            "success": success,
            "message": "Interview results saved"
        }
    
    except Exception as e:
        print(f"Error completing interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.models.schemas import InterviewSession
from app.services.database_service import DatabaseService
from app.routes.websocket_routes import manager

router = APIRouter(prefix="/api/interview", tags=["interview"])
db_service = DatabaseService()

# Store active sessions in memory (or use database)
active_sessions = {}


@router.post("/session/start")
async def start_interview_session(session: InterviewSession):
    """
    Start a new interview session
    """
    try:
        # Store session in memory
        active_sessions[session.interview_id] = {
            **session.dict(),
            "start_time": datetime.now().isoformat()
        }
        
        # Broadcast session start
        await manager.broadcast_status(session.interview_id, {
            "status": "started",
            "message": f"Interview started with {session.candidate_name}",
            "candidate_name": session.candidate_name,
            "job_position": session.job_position
        })
        
        return {
            "success": True,
            "message": "Interview session started",
            "interview_id": session.interview_id
        }
    
    except Exception as e:
        print(f"Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{interview_id}/pause")
async def pause_interview_session(interview_id: str):
    """
    Pause an interview session
    """
    try:
        if interview_id in active_sessions:
            active_sessions[interview_id]["status"] = "paused"
            
            await manager.broadcast_status(interview_id, {
                "status": "paused",
                "message": "Interview paused"
            })
            
            return {
                "success": True,
                "message": "Interview paused"
            }
        else:
            raise HTTPException(status_code=404, detail="Interview not found")
    
    except Exception as e:
        print(f"Error pausing interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/{interview_id}/resume")
async def resume_interview_session(interview_id: str):
    """
    Resume a paused interview session
    """
    try:
        if interview_id in active_sessions:
            active_sessions[interview_id]["status"] = "active"
            
            await manager.broadcast_status(interview_id, {
                "status": "active",
                "message": "Interview resumed"
            })
            
            return {
                "success": True,
                "message": "Interview resumed"
            }
        else:
            raise HTTPException(status_code=404, detail="Interview not found")
    
    except Exception as e:
        print(f"Error resuming interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{interview_id}")
async def get_interview_session(interview_id: str):
    """
    Get details of an active interview session
    """
    try:
        if interview_id in active_sessions:
            return {
                "success": True,
                "session": active_sessions[interview_id]
            }
        else:
            raise HTTPException(status_code=404, detail="Interview not found")
    
    except Exception as e:
        print(f"Error fetching interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

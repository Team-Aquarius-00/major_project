from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import FRONTEND_URL, DEBUG
from app.routes import websocket_routes, monitoring_routes, interview_routes, speech_routes

# Initialize FastAPI app
app = FastAPI(
    title="Interview Monitoring Backend",
    description="FastAPI backend for interview monitoring with gaze tracking and object detection",
    version="1.0.0",
    debug=DEBUG
)

# Configure CORS
allowed_origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:8080",
]

if DEBUG:
    allowed_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(websocket_routes.router)
app.include_router(monitoring_routes.router)
app.include_router(interview_routes.router)
app.include_router(speech_routes.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Interview Monitoring Backend",
        "version": "1.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "interview-monitoring-api"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    print(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "message": "Internal server error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    from app.config import SERVER_HOST, SERVER_PORT
    
    uvicorn.run(
        "app.main:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=DEBUG,
        log_level="info"
    )

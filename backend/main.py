import sys
import os

# Ensure we can import from src
sys.path.append(os.path.abspath('.'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.api import auth, events, analytics, settings, websockets, students, monitoring
from src.core.video_manager import VideoStreamManager
from src.core.database import SessionLocal
from src.models import VideoSource

app = FastAPI(
    title="Drishti AI ExamGuard API",
    description="Backend API for the automated proctoring system.",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon. Restrict in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(websockets.router, prefix="/api/ws", tags=["websockets"])
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])

@app.on_event("startup")
def startup_event():
    # Initialize Video Manager
    manager = VideoStreamManager()
    
    # Start streams for all running video sources
    db = SessionLocal()
    try:
        sources = db.query(VideoSource).filter(VideoSource.status == "RUNNING").all()
        for source in sources:
            manager.start_stream(source.id, source.location)
    except Exception as e:
        print(f"Error starting video streams: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

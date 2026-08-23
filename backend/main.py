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

from fastapi.staticfiles import StaticFiles
import os

# Create outputs/snapshots if it doesn't exist
os.makedirs("outputs/snapshots", exist_ok=True)
app.mount("/static", StaticFiles(directory="outputs"), name="static")

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
            
        # Seed events from latest commit's events.json if table is empty
        from src.models import Event, Student
        import json
        from datetime import datetime, timedelta
        
        # Check if we already have events seeded
        existing_events_count = db.query(Event).count()
        if existing_events_count <= 2: # allows overwrite of standard mock events
            json_paths = ["backend/outputs/events.json", "outputs/events.json", "backend/logs/events.json"]
            events_data = []
            for path in json_paths:
                if os.path.exists(path):
                    try:
                        with open(path, "r", encoding="utf-8") as f:
                            events_data = json.load(f)
                            print(f"Loaded {len(events_data)} events from {path}")
                            break
                    except Exception as e:
                        print(f"Failed to read {path}: {e}")
            
            if events_data:
                # Clear legacy mock events if any
                db.query(Event).delete()
                db.commit()
                
                base_time = datetime.now()
                for item in events_data:
                    # student_id needs to exist in students table
                    stud_id = f"student_{int(item['student_id']):03d}" if item['student_id'].isdigit() else item['student_id']
                    student = db.query(Student).filter(Student.id == stud_id).first()
                    if not student:
                        student = Student(id=stud_id)
                        db.add(student)
                        db.commit()
                    
                    # Convert timestamp offset or float to datetime
                    sec_offset = float(item.get("timestamp", 0))
                    evt_time = base_time - timedelta(seconds=120) + timedelta(seconds=sec_offset)
                    
                    db_event = Event(
                        source_id=1, # Default legacy/first camera source
                        student_id=stud_id,
                        behaviour_type=item["behaviour_type"],
                        confidence=float(item["confidence"]),
                        explanation=item["explanation"],
                        timestamp=evt_time,
                        keypoints=item.get("keypoints_snapshot", {})
                    )
                    db.add(db_event)
                db.commit()
                print(f"Seeded {len(events_data)} events from events.json into DB.")
                
    except Exception as e:
        print(f"Error starting video streams or seeding events: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import os
    in_docker = os.path.exists("/.dockerenv")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=not in_docker)

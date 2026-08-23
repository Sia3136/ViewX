from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from src.core.database import get_db
from src.models import VideoSource
from src.core.video_manager import VideoStreamManager

router = APIRouter()

@router.get("/")
def get_video_sources(db: Session = Depends(get_db)):
    """Return all configured video sources, filtering out inactive/corrupted ones"""
    sources = db.query(VideoSource).all()
    manager = VideoStreamManager()
    active_ids = manager.processors.keys()
    
    # Only return live, actively processing streams to avoid corrupted feeds in UI
    return [
        {"id": s.id, "name": s.name, "type": s.type, "location": s.location, "status": "active"} 
        for s in sources if s.id in active_ids
    ]

@router.get("/{source_id}/stream")
def get_video_stream(source_id: int):
    """Return an MJPEG stream for a given source_id"""
    manager = VideoStreamManager()
    return StreamingResponse(manager.get_frame_generator(source_id), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/health")
def get_monitoring_health():
    """Return health status of video streams"""
    manager = VideoStreamManager()
    return {
        "status": "ok",
        "active_streams": list(manager.processors.keys())
    }

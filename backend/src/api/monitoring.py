from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from backend.src.core.database import get_db
from backend.src.models import VideoSource
from backend.src.core.video_manager import VideoStreamManager

router = APIRouter()

@router.get("/")
def get_video_sources(db: Session = Depends(get_db)):
    """Return all configured video sources"""
    sources = db.query(VideoSource).all()
    return [{"id": s.id, "name": s.name, "type": s.type, "location": s.location, "status": s.status} for s in sources]

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

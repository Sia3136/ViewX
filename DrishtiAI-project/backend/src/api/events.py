from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from src.core.database import get_db
from src.core.security import get_current_user
from src.models import Event, User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class EventResponse(BaseModel):
    id: int
    student_id: str
    behaviour_type: str
    confidence: float
    explanation: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[EventResponse])
def get_events(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[str] = None,
    behaviour_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Event)
    
    if student_id:
        query = query.filter(Event.student_id == student_id)
        
    if behaviour_type:
        query = query.filter(Event.behaviour_type == behaviour_type)
        
    events = query.order_by(desc(Event.timestamp)).offset(skip).limit(limit).all()
    return events

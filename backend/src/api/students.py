from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.core.database import get_db
from src.core.security import get_current_user
from src.models import Student, Event, User
from pydantic import BaseModel

router = APIRouter()

class StudentResponse(BaseModel):
    id: str
    event_count: int
    risk_score: float
    status: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[StudentResponse])
def get_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    students = db.query(Student).all()
    results = []
    for student in students:
        # Get count of events
        event_count = db.query(func.count(Event.id)).filter(Event.student_id == student.id).scalar() or 0
        
        # Calculate a rough risk score
        risk_score = min(event_count * 10.0, 100.0)
        
        # Determine status
        status = "Monitoring"
        if risk_score > 60:
            status = "Critical"
        elif risk_score > 30:
            status = "Warning"
            
        results.append({
            "id": student.id,
            "event_count": event_count,
            "risk_score": risk_score,
            "status": status
        })
        
    return results

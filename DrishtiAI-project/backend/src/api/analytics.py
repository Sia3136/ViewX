from typing import Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.core.database import get_db
from src.core.security import get_current_user
from src.models import Event, User

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, int]:
    
    # Count grouped by behaviour type
    counts = db.query(
        Event.behaviour_type, 
        func.count(Event.id)
    ).group_by(Event.behaviour_type).all()
    
    summary = {item[0]: item[1] for item in counts}
    
    # Add a total count
    summary["total_events"] = sum(summary.values())
    
    return summary

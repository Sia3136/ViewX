from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.core.security import get_current_user
from src.models import SystemConfig, User
from pydantic import BaseModel

router = APIRouter()

class SettingUpdate(BaseModel):
    key: str
    value: str

@router.get("/")
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    
    settings = db.query(SystemConfig).all()
    return {s.key: s.value for s in settings}

@router.patch("/")
def update_settings(
    updates: List[SettingUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update settings")
        
    for update in updates:
        setting = db.query(SystemConfig).filter(SystemConfig.key == update.key).first()
        if setting:
            setting.value = update.value
        else:
            setting = SystemConfig(key=update.key, value=update.value)
            db.add(setting)
            
    db.commit()
    return {"message": "Settings updated successfully"}

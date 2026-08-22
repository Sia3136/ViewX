from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum

Base = declarative_base()

class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    INVIGILATOR = "invigilator"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.INVIGILATOR, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class VideoSource(Base):
    __tablename__ = "video_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # e.g., "FILE", "RTSP"
    location = Column(String, nullable=False)
    status = Column(String, nullable=False, default="STOPPED") # RUNNING, STOPPED, ERROR
    created_at = Column(DateTime, default=datetime.utcnow)
    
    events = relationship("Event", back_populates="source")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(String, primary_key=True, index=True) # Anonymized string ID
    created_at = Column(DateTime, default=datetime.utcnow)
    
    events = relationship("Event", back_populates="student")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("video_sources.id"), index=True, nullable=False)
    student_id = Column(String, ForeignKey("students.id"), index=True, nullable=False)
    behaviour_type = Column(String, index=True, nullable=False)
    confidence = Column(Float, nullable=False)
    explanation = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    keypoints = Column(JSONB, nullable=True)
    
    student = relationship("Student", back_populates="events")
    source = relationship("VideoSource", back_populates="events")

class SystemConfig(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

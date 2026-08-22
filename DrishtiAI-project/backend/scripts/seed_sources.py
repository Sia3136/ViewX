import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import VideoSource, Base

# Connect to DB
DB_URL = os.environ.get("DATABASE_URL", "postgresql://examguard_user:supersecretpassword@localhost:5432/examguard")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_sources():
    session = SessionLocal()
    
    # Check if we already have these sources (beyond the legacy one created in migration)
    existing = session.query(VideoSource).filter(VideoSource.id > 1).count()
    if existing >= 8:
        print("Sources already seeded.")
        return
        
    videos = [
        {"name": "Camera 1 - Mobile Usage A", "type": "FILE", "location": "input videos/01.Candidate was found using a mobile phone in the examination hall..mkv"},
        {"name": "Camera 2 - Mobile Usage B", "type": "FILE", "location": "input videos/02.Candidate was found using a mobile phone in the examination hall..mkv"},
        {"name": "Camera 3 - Mobile Usage C", "type": "FILE", "location": "input videos/03.CCTV Mobile Usage.mkv"},
        {"name": "Camera 4 - Talking", "type": "FILE", "location": "input videos/04.CCTV Candidate Talking.mkv"},
        {"name": "Camera 5 - Crowd at Desk", "type": "FILE", "location": "input videos/05.Crowd observed near the reception and verification desk..mp4"},
        {"name": "Camera 6 - Mobile Usage D", "type": "FILE", "location": "input videos/06.Candidate was found using a mobile phone in the examination hall..mp4"},
        {"name": "Camera 7 - Exchanging Seats", "type": "FILE", "location": "input videos/During the exam, the candidates exchanged their seats with each other..mp4"},
        {"name": "Camera 8 - Paper from Desk", "type": "FILE", "location": "input videos/Seat No. 12 was seen taking a piece of paper from the desk.mkv"},
    ]
    
    for v in videos:
        # Check if exists by name just in case
        if not session.query(VideoSource).filter_by(name=v["name"]).first():
            source = VideoSource(
                name=v["name"],
                type=v["type"],
                location=v["location"],
                status="STOPPED"
            )
            session.add(source)
            
    session.commit()
    session.close()
    print("Successfully seeded 8 VideoSources.")

if __name__ == "__main__":
    seed_sources()

import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set environment variable before any imports that depend on database.py
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "postgresql://examguard_user:examguard_secure_pw_123@localhost:5435/examguard"

from src.core.database import SessionLocal
from src.models import VideoSource

def seed_sources():
    session = SessionLocal()
    
    # Sync the sequence to prevent duplicate key errors from manual Alembic seeds
    try:
        session.execute("SELECT setval('video_sources_id_seq', COALESCE((SELECT MAX(id) FROM video_sources), 0) + 1, false)")
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Sequence sync skipped or failed: {e}")
    
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
    
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    
    for v in videos:
        abs_path = os.path.join(project_root, v["location"])
        
        # Phase 13: Strong file validation
        if not os.path.exists(abs_path):
            print(f"WARNING: Video file not found at {abs_path}")
            continue
            
        if not session.query(VideoSource).filter_by(name=v["name"]).first():
            source = VideoSource(
                name=v["name"],
                type=v["type"],
                location=abs_path,
                status="RUNNING" # Set to RUNNING so the VideoManager starts it
            )
            session.add(source)
            
    session.commit()
    session.close()
    print("Successfully seeded VideoSources.")

if __name__ == "__main__":
    seed_sources()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import Base

import os
# Load config from env or fallback
DB_URL = os.getenv("DATABASE_URL", "postgresql://examguard_user:supersecretpassword@localhost:5432/examguard")

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

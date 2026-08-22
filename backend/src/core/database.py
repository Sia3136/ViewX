from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import Base

import os
# Load config from env or fallback
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL or "supersecretpassword" in DB_URL:
    raise ValueError("DATABASE_URL must be set in environment and cannot contain the default dummy password.")

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

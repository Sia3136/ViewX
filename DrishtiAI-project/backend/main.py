import sys
import os

# Ensure we can import from src
sys.path.append(os.path.abspath('.'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.api import auth, events, analytics, settings, websockets

app = FastAPI(
    title="Drishti AI ExamGuard API",
    description="Backend API for the automated proctoring system.",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon. Restrict in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(websockets.router, prefix="/api/ws", tags=["websockets"])

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

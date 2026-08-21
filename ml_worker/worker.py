import cv2
import time
import numpy as np
import sys
import os
import json
import threading
from datetime import datetime
from collections import defaultdict, deque

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import uvicorn

# Add root directory to python path
sys.path.append(os.path.abspath('.'))

from ultralytics import YOLO
from src.pose.pose import get_head_orientation_and_hand_positions
from src.behaviour.behaviour import BehaviorEngine

import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.src.models import Event, Student

# Configuration Constants
DB_URL = "postgresql://examguard_user:supersecretpassword@localhost:5432/examguard"
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0
MODEL_NAME = "yolov8s-pose.pt"
VIDEO_PATH = "input videos/04.CCTV Candidate Talking.mkv"
CONFIDENCE = 0.49
HISTORY_LENGTH = 100
COOLDOWN_SECONDS = 10.0

# Shared state for MJPEG streaming
global_frame = None
frame_lock = threading.Lock()
stop_event = threading.Event()

app = FastAPI(title="ML Worker Video Stream")

def get_db_session():
    """Initializes and returns a new SQLAlchemy database session."""
    engine = create_engine(DB_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def get_redis_client():
    """Initializes and returns a Redis client."""
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

def ensure_student_exists(db_session, student_id: str):
    """Checks if a student exists in the database, and creates one if not."""
    student = db_session.query(Student).filter(Student.id == student_id).first()
    if not student:
        student = Student(id=student_id)
        db_session.add(student)
        db_session.commit()
    return student

def log_event_to_db(db_session, student_id: str, alert: dict, keypoints: dict):
    """Saves a behavior alert event to the PostgreSQL database."""
    ensure_student_exists(db_session, student_id)
    
    db_event = Event(
        student_id=student_id,
        behaviour_type=alert['behavior'],
        confidence=alert['confidence'],
        explanation=alert['reason'],
        keypoints=keypoints
    )
    db_session.add(db_event)
    db_session.commit()

def publish_alert_to_redis(redis_client, student_id: str, alert: dict):
    """Publishes a behavior alert event to the Redis 'alerts' channel."""
    event_payload = {
        'student_id': student_id,
        'behaviour_type': alert['behavior'],
        'confidence': alert['confidence'],
        'explanation': alert['reason'],
        'timestamp': str(datetime.now())
    }
    redis_client.publish('alerts', json.dumps(event_payload))

def extract_pose_features(points, prev_features, current_video_time):
    """Extracts head, hand, and body orientation features from pose keypoints."""
    # Base keypoint extraction from pose module
    features = get_head_orientation_and_hand_positions(points)
    
    # Enrich features with temporal coordinates for BehaviorEngine
    features['timestamp'] = current_video_time
    features['nose'] = (float(points[0][0]), float(points[0][1]))
    features['left_shoulder'] = (float(points[5][0]), float(points[5][1]))
    features['right_shoulder'] = (float(points[6][0]), float(points[6][1]))
    
    # Calculate shoulder angle (degrees)
    dx = features['right_shoulder'][0] - features['left_shoulder'][0]
    dy = features['right_shoulder'][1] - features['left_shoulder'][1]
    features['shoulder_angle'] = float(np.degrees(np.arctan2(dy, dx)))
    
    # Calculate hand movement velocity relative to previous frame
    features['hand_movement'] = 0.0
    if prev_features:
        if prev_features['left_hand'] != (0.0, 0.0) and features['left_hand'] != (0.0, 0.0):
            dl = np.linalg.norm(np.array(features['left_hand']) - np.array(prev_features['left_hand']))
            dr = np.linalg.norm(np.array(features['right_hand']) - np.array(prev_features['right_hand']))
            features['hand_movement'] = float(dl + dr)
            
    return features

def evaluate_behaviors(behavior_engine, temporal_history):
    """Runs the behavior detection algorithms on the student's temporal history."""
    alerts = []
    alerts.append(behavior_engine.detect_sideward_glances(temporal_history))
    alerts.append(behavior_engine.detect_excessive_head_turns(temporal_history))
    alerts.append(behavior_engine.detect_body_rotation(temporal_history))
    alerts.append(behavior_engine.detect_unusual_hand_movements(temporal_history))
    alerts.append(behavior_engine.detect_nonverbal_communication(temporal_history))
    return alerts

def run_worker():
    print(f"Starting ML Worker on video: {VIDEO_PATH}")
    model = YOLO(MODEL_NAME)
    behavior_engine = BehaviorEngine()
    
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print(f"Error: Could not open {VIDEO_PATH}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    student_history = defaultdict(lambda: deque(maxlen=HISTORY_LENGTH))
    last_logged_time = defaultdict(float)
    
    db_session = get_db_session()
    redis_client = get_redis_client()

    frame_count = 0

    try:
        while not stop_event.is_set():
            success, frame = cap.read()
            if not success:
                print("End of video stream or failed to read frame.")
                break
                
            frame_count += 1
            current_video_time = frame_count / fps

            # YOLO inference and tracking
            results = model.track(frame, persist=True, conf=CONFIDENCE, verbose=False, tracker="bytetrack.yaml")
            if not results:
                continue
                
            result = results[0]
            boxes = result.boxes
            keypoints = result.keypoints

            if boxes is None or keypoints is None or boxes.id is None:
                continue
                
            ids = boxes.id.int().cpu().tolist()
            kpts = keypoints.xy.cpu().numpy()

            for i, track_id in enumerate(ids):
                points = kpts[i]
                if len(points) < 17:
                    continue

                # Get previous frame features if available
                history = student_history[track_id]
                prev_features = history[-1] if history else None
                
                # Extract features
                features = extract_pose_features(points, prev_features, current_video_time)
                history.append(features)
                
                student_str_id = f"student_{track_id:03d}"
                
                # Run detectors
                alerts = evaluate_behaviors(behavior_engine, list(history))
                
                for alert in alerts:
                    if alert['detected']:
                        alert_key = f"{student_str_id}_{alert['behavior']}"
                        
                        # Cooldown restriction to prevent alert flooding
                        if (current_video_time - last_logged_time[alert_key]) > COOLDOWN_SECONDS:
                            last_logged_time[alert_key] = current_video_time
                            
                            print(f"[ALERT] {student_str_id} -> {alert['behavior']} (Conf: {alert['confidence']})")
                            
                            # Log and Publish alert
                            log_event_to_db(db_session, student_str_id, alert, features)
                            publish_alert_to_redis(redis_client, student_str_id, alert)

            # Heartbeat indicator
            if frame_count % 100 == 0:
                print(f"Processed {frame_count} frames. Video Time: {current_video_time:.2f}s")
                
            # Update global frame for streaming
            annotated_frame = result.plot()
            ret, buffer = cv2.imencode('.jpg', annotated_frame)
            if ret:
                with frame_lock:
                    global global_frame
                    global_frame = buffer.tobytes()
                
    finally:
        cap.release()
        db_session.close()
        print("Video processing complete.")

def video_generator():
    """Generator for MJPEG stream that yields the latest frame."""
    while True:
        with frame_lock:
            frame = global_frame
            
        if frame is None:
            # If no frame is ready, wait a bit
            time.sleep(0.1)
            continue
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
        # Limit to ~25fps streaming rate (0.04s)
        time.sleep(0.04)

@app.get("/video_feed")
def video_feed():
    """Returns the live MJPEG video stream."""
    return StreamingResponse(video_generator(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.on_event("shutdown")
def shutdown_event():
    """Signal the background worker to stop gracefully on server shutdown."""
    print("Shutting down worker thread...")
    stop_event.set()

if __name__ == "__main__":
    # Start the OpenCV worker loop in a background thread
    worker_thread = threading.Thread(target=run_worker, daemon=True)
    worker_thread.start()
    
    # Run the FastAPI server to serve the stream
    uvicorn.run(app, host="0.0.0.0", port=5000)

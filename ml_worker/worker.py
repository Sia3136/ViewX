import cv2
import time
import numpy as np
import sys
import os
import json
from datetime import datetime
from collections import defaultdict, deque

# Add root directory to python path
sys.path.append(os.path.abspath('.'))

from ultralytics import YOLO
from src.pose.pose import get_head_orientation_and_hand_positions
from src.behaviour.behaviour import BehaviorEngine

import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.src.models import Event, Student

# Configure Database Connection
DB_URL = "postgresql://examguard_user:supersecretpassword@localhost:5432/examguard"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Configure Redis Connection
redis_client = redis.Redis(host='localhost', port=6379, db=0)

MODEL_NAME = "yolov8s-pose.pt"
VIDEO_PATH = "input videos/04.CCTV Candidate Talking.mkv"
CONFIDENCE = 0.49
HISTORY_LENGTH = 100

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
    
    # Keep track of logged alerts to avoid spamming the DB
    last_logged_time = defaultdict(float)
    
    db_session = SessionLocal()

    frame_count = 0
    start_time = time.time()

    while True:
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

            # Extract features from YOLO pose
            features = get_head_orientation_and_hand_positions(points)
            
            # Additional raw points for BehaviorEngine
            features['timestamp'] = current_video_time
            features['nose'] = (float(points[0][0]), float(points[0][1]))
            features['left_shoulder'] = (float(points[5][0]), float(points[5][1]))
            features['right_shoulder'] = (float(points[6][0]), float(points[6][1]))
            
            # Calculate shoulder angle
            dx = features['right_shoulder'][0] - features['left_shoulder'][0]
            dy = features['right_shoulder'][1] - features['left_shoulder'][1]
            features['shoulder_angle'] = float(np.degrees(np.arctan2(dy, dx)))
            
            # Calculate hand movement relative to previous frame
            features['hand_movement'] = 0.0
            history = student_history[track_id]
            if history:
                prev = history[-1]
                if prev['left_hand'] != (0.0, 0.0) and features['left_hand'] != (0.0, 0.0):
                    dl = np.linalg.norm(np.array(features['left_hand']) - np.array(prev['left_hand']))
                    dr = np.linalg.norm(np.array(features['right_hand']) - np.array(prev['right_hand']))
                    features['hand_movement'] = float(dl + dr)
            
            # Update history
            history.append(features)
            
            # Ensure student exists in DB
            student_str_id = f"student_{track_id:03d}"
            
            # Run behavior engine detectors
            temporal_features = list(history)
            alerts = []
            
            alerts.append(behavior_engine.detect_sideward_glances(temporal_features))
            alerts.append(behavior_engine.detect_excessive_head_turns(temporal_features))
            alerts.append(behavior_engine.detect_body_rotation(temporal_features))
            alerts.append(behavior_engine.detect_unusual_hand_movements(temporal_features))
            alerts.append(behavior_engine.detect_nonverbal_communication(temporal_features))
            
            for alert in alerts:
                if alert['detected']:
                    # Cooldown check (don't log the exact same behavior for the same student within 10 seconds)
                    alert_key = f"{student_str_id}_{alert['behavior']}"
                    if (current_video_time - last_logged_time[alert_key]) > 10.0:
                        last_logged_time[alert_key] = current_video_time
                        
                        print(f"[ALERT] {student_str_id} -> {alert['behavior']} (Conf: {alert['confidence']})")
                        
                        # Ensure student exists in DB before inserting event
                        student = db_session.query(Student).filter(Student.id == student_str_id).first()
                        if not student:
                            student = Student(id=student_str_id)
                            db_session.add(student)
                            db_session.commit()
                        
                        # Insert Event to DB
                        db_event = Event(
                            student_id=student_str_id,
                            behaviour_type=alert['behavior'],
                            confidence=alert['confidence'],
                            explanation=alert['reason'],
                            keypoints=features # log the current frame's features as JSONB
                        )
                        db_session.add(db_event)
                        db_session.commit()
                        
                        # Publish to Redis for WebSockets
                        redis_client.publish('alerts', json.dumps({
                            'student_id': student_str_id,
                            'behaviour_type': alert['behavior'],
                            'confidence': alert['confidence'],
                            'explanation': alert['reason'],
                            'timestamp': str(datetime.now())
                        }))

        # Print heartbeat every 100 frames
        if frame_count % 100 == 0:
            print(f"Processed {frame_count} frames. Video Time: {current_video_time:.2f}s")
            
    cap.release()
    db_session.close()
    print("Video processing complete.")

if __name__ == "__main__":
    run_worker()

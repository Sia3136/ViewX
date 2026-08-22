import cv2
import time
import numpy as np
import sys
import os
import json
import threading
import queue
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
<<<<<<< HEAD
=======
from src.detection.object_detector import ProhibitedObjectDetector, link_objects_to_students
>>>>>>> 0754b75 (first addition)

import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
<<<<<<< HEAD
from backend.src.models import Event, Student
=======
from backend.src.models import Event, Student, SystemConfig, VideoSource
>>>>>>> 0754b75 (first addition)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configuration Constants
<<<<<<< HEAD
DB_URL = os.environ.get("DATABASE_URL", "postgresql://examguard_user:supersecretpassword@localhost:5432/examguard")
=======
DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL or "supersecretpassword" in DB_URL:
    raise ValueError("DATABASE_URL must be set in environment and cannot contain the default dummy password.")

>>>>>>> 0754b75 (first addition)
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))
REDIS_DB = int(os.environ.get("REDIS_DB", "0"))
MODEL_NAME = os.environ.get("MODEL_NAME", "yolov8s-pose.pt")
<<<<<<< HEAD
VIDEO_PATH = os.environ.get("VIDEO_PATH", "input videos/04.CCTV Candidate Talking.mkv")
=======
OBJECT_MODEL_NAME = os.environ.get("OBJECT_MODEL_NAME", "yolov8s.pt")

VIDEO_PATH = os.environ.get("VIDEO_PATH")
if not VIDEO_PATH:
    raise ValueError("VIDEO_PATH must be set in environment.")

>>>>>>> 0754b75 (first addition)
CONFIDENCE = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.49"))
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

<<<<<<< HEAD
db_queue = queue.Queue()
=======
db_queue = queue.Queue(maxsize=1000)

def get_or_create_source(db_session, location: str):
    """Gets or creates a VideoSource for the current worker."""
    source = db_session.query(VideoSource).filter(VideoSource.location == location).first()
    if not source:
        # Fallback if the path wasn't seeded
        source = db_session.query(VideoSource).filter(VideoSource.id == 1).first()
        if not source:
            source = VideoSource(name="Camera 1 - Fallback", type="FILE", location=location, status="RUNNING")
            db_session.add(source)
            db_session.commit()
            db_session.refresh(source)
    return source.id
>>>>>>> 0754b75 (first addition)

def db_writer_thread():
    """Background thread to handle database writes asynchronously."""
    db_session = get_db_session()
    print("Database writer thread started.")
<<<<<<< HEAD
=======
    
    # Pre-fetch or create the source_id to avoid doing it per-event
    source_id = get_or_create_source(db_session, VIDEO_PATH)
    
>>>>>>> 0754b75 (first addition)
    try:
        while True:
            try:
                task = db_queue.get()
                if task is None:
                    break
                
                student_id, alert, keypoints = task
                ensure_student_exists(db_session, student_id)
                
                db_event = Event(
<<<<<<< HEAD
=======
                    source_id=source_id,
>>>>>>> 0754b75 (first addition)
                    student_id=student_id,
                    behaviour_type=alert['behavior'],
                    confidence=alert['confidence'],
                    explanation=alert['reason'],
                    keypoints=keypoints
                )
                db_session.add(db_event)
                db_session.commit()
            except Exception as e:
                print(f"Error in DB writer thread: {e}")
                db_session.rollback()
            finally:
                db_queue.task_done()
    finally:
        db_session.close()
        print("Database writer thread stopped.")

def ensure_student_exists(db_session, student_id: str):
    """Checks if a student exists in the database, and creates one if not."""
    student = db_session.query(Student).filter(Student.id == student_id).first()
    if not student:
        student = Student(id=student_id)
        db_session.add(student)
        db_session.commit()
    return student

def log_event_to_db(student_id: str, alert: dict, keypoints: dict):
    """Enqueues a behavior alert event to be saved by the background thread."""
<<<<<<< HEAD
    db_queue.put((student_id, alert, keypoints))
=======
    try:
        db_queue.put((student_id, alert, keypoints), block=False)
    except queue.Full:
        print(f"WARNING: db_queue is full. Dropping event for {student_id}")
>>>>>>> 0754b75 (first addition)

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

<<<<<<< HEAD
=======
def update_config(db_session, behavior_engine):
    global CONFIDENCE
    try:
        settings = db_session.query(SystemConfig).all()
        settings_dict = {s.key: s.value for s in settings}
        if "confidence_threshold" in settings_dict:
            CONFIDENCE = float(settings_dict["confidence_threshold"])
        behavior_engine.update_thresholds(settings_dict)
    except Exception as e:
        print(f"Error updating config: {e}")
        db_session.rollback()

>>>>>>> 0754b75 (first addition)
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
<<<<<<< HEAD
=======
    object_detector = ProhibitedObjectDetector(model_path=OBJECT_MODEL_NAME)
>>>>>>> 0754b75 (first addition)
    behavior_engine = BehaviorEngine()
    
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print(f"Error: Could not open {VIDEO_PATH}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    student_history = defaultdict(lambda: deque(maxlen=HISTORY_LENGTH))
    last_logged_time = defaultdict(float)
    
    redis_client = get_redis_client()
<<<<<<< HEAD
=======
    db_session_for_config = get_db_session()
    
    # Load initial config
    update_config(db_session_for_config, behavior_engine)
    last_config_check_time = time.time()
    active_alerts_draw = {}
>>>>>>> 0754b75 (first addition)
    
    db_thread = threading.Thread(target=db_writer_thread, daemon=True)
    db_thread.start()

    frame_count = 0
<<<<<<< HEAD
=======
    fps_start_time = time.time()
>>>>>>> 0754b75 (first addition)

    try:
        while not stop_event.is_set():
            success, frame = cap.read()
            if not success:
                print("End of video stream or failed to read frame.")
                break
                
            frame_count += 1
            current_video_time = frame_count / fps

<<<<<<< HEAD
=======
            # Periodically update config (every 10 seconds real-time)
            if time.time() - last_config_check_time > 10.0:
                update_config(db_session_for_config, behavior_engine)
                last_config_check_time = time.time()

>>>>>>> 0754b75 (first addition)
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

<<<<<<< HEAD
=======
            students_data = []
>>>>>>> 0754b75 (first addition)
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
                
<<<<<<< HEAD
=======
                students_data.append({
                    'id': student_str_id,
                    'box': result.boxes.xyxy[i].cpu().numpy().tolist(),
                    'left_hand': features.get('left_hand', (0,0)),
                    'right_hand': features.get('right_hand', (0,0)),
                })
                
>>>>>>> 0754b75 (first addition)
                # Run detectors
                alerts = evaluate_behaviors(behavior_engine, list(history))
                
                for alert in alerts:
                    if alert['detected']:
                        alert_key = f"{student_str_id}_{alert['behavior']}"
                        
                        # Cooldown restriction to prevent alert flooding
                        if (current_video_time - last_logged_time[alert_key]) > COOLDOWN_SECONDS:
                            last_logged_time[alert_key] = current_video_time
                            
                            print(f"[ALERT] {student_str_id} -> {alert['behavior']} (Conf: {alert['confidence']})")
                            
<<<<<<< HEAD
=======
                            active_alerts_draw[track_id] = (alert['behavior'], current_video_time + 2.0)
                            
>>>>>>> 0754b75 (first addition)
                            # Log and Publish alert
                            log_event_to_db(student_str_id, alert, features)
                            publish_alert_to_redis(redis_client, student_str_id, alert)

<<<<<<< HEAD
            # Heartbeat indicator
            if frame_count % 100 == 0:
                print(f"Processed {frame_count} frames. Video Time: {current_video_time:.2f}s")
                
            # Update global frame for streaming
            annotated_frame = result.plot()
=======
            # --- Phase 2: Object Detection and Association ---
            detected_objects = object_detector.detect_objects(frame, conf_threshold=0.25)
            if detected_objects and students_data:
                linked_objects = link_objects_to_students(detected_objects, students_data)
                
                for obj in linked_objects:
                    assigned_id = obj.get('assigned_student_id')
                    if assigned_id and assigned_id not in ["unassigned", "ambiguous"]:
                        behavior_name = f"prohibited_object_{obj['class_name'].replace(' ', '_')}"
                        alert_key = f"{assigned_id}_{behavior_name}"
                        
                        if (current_video_time - last_logged_time[alert_key]) > COOLDOWN_SECONDS:
                            last_logged_time[alert_key] = current_video_time
                            
                            alert = {
                                'behavior': behavior_name,
                                'detected': True,
                                'confidence': obj['confidence'] * obj['association_confidence'],
                                'reason': f"Detected {obj['class_name']} associated with student."
                            }
                            
                            print(f"[ALERT] {assigned_id} -> {behavior_name} (Conf: {alert['confidence']})")
                            
                            # track_id could be derived from assigned_id (e.g. "student_001" -> 1)
                            if assigned_id.startswith("student_"):
                                try:
                                    tid = int(assigned_id.split("_")[1])
                                    active_alerts_draw[tid] = (behavior_name, current_video_time + 2.0)
                                except ValueError:
                                    pass
                            
                            # Use the latest features of the student for keypoints context
                            # It's an approximation, but sufficient for object detection events
                            features_ctx = {}
                            if history:
                                features_ctx = history[-1]
                                
                            log_event_to_db(assigned_id, alert, features_ctx)
                            publish_alert_to_redis(redis_client, assigned_id, alert)

            # Heartbeat & FPS indicator
            if frame_count % 50 == 0:
                elapsed = time.time() - fps_start_time
                actual_fps = 50 / elapsed if elapsed > 0 else 0
                active_students = len(students_data) if 'students_data' in locals() else 0
                print(f"Processed {frame_count} frames. FPS: {actual_fps:.1f}, Queue: {db_queue.qsize()}")
                
                metrics_payload = {
                    "fps": round(actual_fps, 1),
                    "active_students": active_students,
                    "queue_depth": db_queue.qsize(),
                    "timestamp": str(datetime.now())
                }
                redis_client.publish('metrics', json.dumps(metrics_payload))
                fps_start_time = time.time()
                
            # Update global frame for streaming
            annotated_frame = result.plot()
            
            # Draw detected objects
            if 'linked_objects' in locals() and linked_objects:
                for obj in linked_objects:
                    x1, y1, x2, y2 = obj['box']
                    assigned_id = obj.get('assigned_student_id', 'unassigned')
                    label = f"{obj['class_name']} ({assigned_id})"
                    color = (0, 0, 255) if assigned_id not in ["unassigned", "ambiguous"] else (0, 255, 255)
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(annotated_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    
            # Draw behavior alerts on top of students
            if 'ids' in locals() and 'result' in locals():
                for i, track_id in enumerate(ids):
                    if track_id in active_alerts_draw:
                        behavior_text, expiry = active_alerts_draw[track_id]
                        if current_video_time < expiry:
                            x1, y1, x2, y2 = result.boxes.xyxy[i].cpu().numpy().tolist()
                            cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 165, 255), 3) # Orange box
                            cv2.putText(annotated_frame, behavior_text, (int(x1), int(y1) - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
                        
>>>>>>> 0754b75 (first addition)
            ret, buffer = cv2.imencode('.jpg', annotated_frame)
            if ret:
                with frame_lock:
                    global global_frame
                    global_frame = buffer.tobytes()
                
    finally:
        cap.release()
        db_queue.put(None) # Signal DB thread to stop
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

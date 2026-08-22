import cv2
import time
import threading
import json
from datetime import datetime
from collections import defaultdict, deque
from typing import Dict, Optional, Tuple

from ultralytics import YOLO
from ultralytics.trackers.byte_tracker import BYTETracker

from src.pose.pose import get_head_orientation_and_hand_positions
from src.behaviour.behaviour import BehaviorEngine
from src.detection.object_detector import ProhibitedObjectDetector, link_objects_to_students

import redis
import os

from backend.src.core.database import SessionLocal
from backend.src.models import Event, Student

# Dummy arguments class for BYTETracker init
class TrackerArgs:
    def __init__(self):
        self.track_thresh = 0.45
        self.track_buffer = 30
        self.match_thresh = 0.8
        self.gmc_method = 'sparseOptFlow'

class VideoProcessor:
    def __init__(self, source_id: int, location: str, shared_pose_model, shared_object_model, inference_lock, redis_client):
        self.source_id = source_id
        self.location = location
        self.pose_model = shared_pose_model
        self.object_model = shared_object_model
        self.inference_lock = inference_lock
        self.redis_client = redis_client
        
        # Dedicated tracker for this stream
        self.tracker = BYTETracker(TrackerArgs(), frame_rate=5)
        
        self.behavior_engine = BehaviorEngine()
        self.prohibited_detector = ProhibitedObjectDetector(model_path="yolov8s.pt") # Lightweight
        
        self.running = False
        self.latest_frame = None
        self.annotated_frame = None
        self.frame_lock = threading.Lock()
        
        self.capture_thread = None
        self.inference_thread = None
        
        self.student_history = defaultdict(lambda: deque(maxlen=60))
        self.active_alerts = {} # track_id -> (behavior, expiry_time)
        self.last_logged_time = defaultdict(float)
        
        self.COOLDOWN = 10.0
        self.INFERENCE_FPS = 5.0
        
    def start(self):
        self.running = True
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.inference_thread = threading.Thread(target=self._inference_loop, daemon=True)
        self.capture_thread.start()
        self.inference_thread.start()
        
    def stop(self):
        self.running = False
        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)
        if self.inference_thread:
            self.inference_thread.join(timeout=2.0)
            
    def _capture_loop(self):
        cap = cv2.VideoCapture(self.location)
        if not cap.isOpened():
            print(f"[VideoProcessor-{self.source_id}] Failed to open {self.location}")
            self.running = False
            return
            
        while self.running:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            with self.frame_lock:
                self.latest_frame = frame
                # If annotated frame isn't ready yet, use raw
                if self.annotated_frame is None:
                    self.annotated_frame = frame.copy()
            
            # Read at ~30 FPS
            time.sleep(1/30.0)
            
        cap.release()
        
    def _inference_loop(self):
        frame_count = 0
        while self.running:
            start_time = time.time()
            
            with self.frame_lock:
                if self.latest_frame is None:
                    time.sleep(0.1)
                    continue
                frame = self.latest_frame.copy()
                
            current_video_time = time.time()
            
            # --- Inference with Shared Models ---
            with self.inference_lock:
                # Pose Model
                pose_results = self.pose_model.predict(frame, conf=0.45, imgsz=640, verbose=False, agnostic_nms=True)[0]
                # Object Model (Lightweight)
                obj_results = self.object_model.predict(frame, conf=0.25, classes=[67, 73], verbose=False)[0]
                
            annotated_frame = frame.copy()
            
            # Extract detections for Tracker
            if pose_results.boxes is not None and len(pose_results.boxes) > 0:
                boxes = pose_results.boxes.xyxy.cpu().numpy()
                confs = pose_results.boxes.conf.cpu().numpy()
                cls_ids = pose_results.boxes.cls.cpu().numpy()
                
                # Format for BYTETracker: [x1, y1, x2, y2, conf, cls]
                dets = np.column_stack((boxes, confs, cls_ids))
                
                # Update tracking state
                tracks = self.tracker.update(dets, frame)
                
                # Mapping original boxes to tracks (approximation based on IoU or we can use the tracker boxes directly)
                track_ids = []
                track_boxes = []
                for track in tracks:
                    track_ids.append(track.track_id)
                    track_boxes.append(track.tlbr) # [x1, y1, x2, y2]
                    
                # We need keypoints mapped to track IDs...
                # For simplicity, we skip full behaviour engine in this minimal port, 
                # or just draw bounding boxes. We will just draw the tracking boxes.
                students_data = []
                for tid, tbox in zip(track_ids, track_boxes):
                    x1, y1, x2, y2 = map(int, tbox)
                    student_str_id = f"source{self.source_id}_student{tid}"
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                    cv2.putText(annotated_frame, f"ID: {tid}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,0,0), 2)
                    students_data.append({"id": student_str_id, "box": [x1, y1, x2, y2]})
                    
                # Process objects
                detected_objects = []
                if obj_results.boxes is not None and len(obj_results.boxes) > 0:
                    obj_boxes = obj_results.boxes.xyxy.cpu().numpy()
                    obj_confs = obj_results.boxes.conf.cpu().numpy()
                    obj_cls = obj_results.boxes.cls.int().cpu().numpy()
                    
                    for obox, oconf, ocls in zip(obj_boxes, obj_confs, obj_cls):
                        cname = obj_results.names[ocls]
                        detected_objects.append({
                            "box": [int(x) for x in obox],
                            "confidence": float(oconf),
                            "class_id": int(ocls),
                            "class_name": cname
                        })
                        
                if detected_objects and students_data:
                    linked_objects = link_objects_to_students(detected_objects, students_data)
                    for obj in linked_objects:
                        assigned_id = obj.get('assigned_student_id')
                        if assigned_id and assigned_id not in ["unassigned", "ambiguous"]:
                            behavior_name = f"prohibited_object_{obj['class_name'].replace(' ', '_')}"
                            alert_key = f"{assigned_id}_{behavior_name}"
                            
                            if (current_video_time - self.last_logged_time[alert_key]) > self.COOLDOWN:
                                self.last_logged_time[alert_key] = current_video_time
                                alert = {
                                    'behavior': behavior_name,
                                    'confidence': float(obj['confidence']),
                                    'reason': f"Detected {obj['class_name']}"
                                }
                                self._trigger_alert(assigned_id, alert)
                                
                        # Draw objects
                        x1, y1, x2, y2 = obj['box']
                        color = (0, 0, 255) if assigned_id not in ["unassigned", "ambiguous"] else (0, 255, 255)
                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(annotated_frame, f"{obj['class_name']} ({assigned_id})", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            with self.frame_lock:
                self.annotated_frame = annotated_frame
                
            elapsed = time.time() - start_time
            sleep_time = max(0, (1.0 / self.INFERENCE_FPS) - elapsed)
            time.sleep(sleep_time)

    def _trigger_alert(self, student_id: str, alert: dict):
        event_payload = {
            'source_id': self.source_id,
            'student_id': student_id,
            'behaviour_type': alert['behavior'],
            'confidence': alert['confidence'],
            'explanation': alert['reason'],
            'timestamp': str(datetime.now())
        }
        self.redis_client.publish('alerts', json.dumps(event_payload))
        
        # Save to DB
        try:
            db = SessionLocal()
            # Ensure student exists
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                db.add(Student(id=student_id))
                db.commit()
                
            db_event = Event(
                source_id=self.source_id,
                student_id=student_id,
                behaviour_type=alert['behavior'],
                confidence=alert['confidence'],
                explanation=alert['reason'],
                keypoints={}
            )
            db.add(db_event)
            db.commit()
            db.close()
        except Exception as e:
            print(f"[VideoProcessor-{self.source_id}] DB Error: {e}")

    def get_frame(self):
        with self.frame_lock:
            frame = self.annotated_frame
        if frame is not None:
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                return buffer.tobytes()
        return None

class VideoStreamManager:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(VideoStreamManager, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance
        
    def __init__(self):
        if self.initialized:
            return
            
        print("[VideoStreamManager] Initializing shared models...")
        self.pose_model = YOLO("yolov8s-pose.pt")
        self.object_model = YOLO("yolov8s.pt")
        self.inference_lock = threading.Lock()
        
        # Optional: dummy forward pass to warmup
        dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        self.pose_model.predict(dummy_frame, verbose=False)
        self.object_model.predict(dummy_frame, verbose=False)
        
        redis_host = os.environ.get("REDIS_HOST", "localhost")
        redis_port = int(os.environ.get("REDIS_PORT", "6379"))
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)
        
        self.processors: Dict[int, VideoProcessor] = {}
        self.initialized = True
        
    def start_stream(self, source_id: int, location: str):
        if source_id in self.processors:
            return # Already running
            
        print(f"[VideoStreamManager] Starting processor for source {source_id} at {location}")
        processor = VideoProcessor(
            source_id=source_id,
            location=location,
            shared_pose_model=self.pose_model,
            shared_object_model=self.object_model,
            inference_lock=self.inference_lock,
            redis_client=self.redis_client
        )
        processor.start()
        self.processors[source_id] = processor
        
    def stop_stream(self, source_id: int):
        if source_id in self.processors:
            print(f"[VideoStreamManager] Stopping processor for source {source_id}")
            self.processors[source_id].stop()
            del self.processors[source_id]
            
    def get_processor(self, source_id: int) -> Optional[VideoProcessor]:
        return self.processors.get(source_id)

    def get_frame_generator(self, source_id: int):
        processor = self.get_processor(source_id)
        if not processor:
            # yield dummy grey frame
            def dummy_gen():
                blank_frame = np.ones((480, 640, 3), dtype=np.uint8) * 128
                ret, buffer = cv2.imencode('.jpg', blank_frame)
                frame_bytes = buffer.tobytes()
                while True:
                    yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                    time.sleep(0.1)
            return dummy_gen()

        def gen():
            while True:
                frame = processor.get_frame()
                if frame is not None:
                    yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                time.sleep(0.05) # ~20 fps output
        return gen()

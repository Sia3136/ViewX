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
import math
import numpy as np

from src.core.database import SessionLocal
from src.models import Event, Student

class TrackerArgs:
    def __init__(self):
        self.track_high_thresh = 0.45
        self.track_low_thresh = 0.1
        self.new_track_thresh = 0.5
        self.track_buffer = 30
        self.match_thresh = 0.8
        self.gmc_method = 'sparseOptFlow'
        self.fuse_score = True
        self.tracker_type = 'bytetrack'

class VideoProcessor:
    def __init__(self, source_id: int, location: str, shared_pose_model, shared_object_model, inference_lock, redis_client):
        self.source_id = source_id
        self.location = location
        self.pose_model = shared_pose_model
        self.object_model = shared_object_model
        self.inference_lock = inference_lock
        self.redis_client = redis_client
        
        # Dedicated tracker for this stream
        self.tracker = BYTETracker(TrackerArgs())
        
        self.behavior_engine = BehaviorEngine()
        self.prohibited_detector = ProhibitedObjectDetector(model_path="yolov8s.pt") # Lightweight
        
        self.running = False
        self.latest_frame = None
        self.annotated_frame = None
        self.frame_lock = threading.Lock()
        
        self.capture_thread = None
        self.inference_thread = None
        
        self.student_history = defaultdict(lambda: deque(maxlen=60))
        self.alert_states = defaultdict(lambda: defaultdict(bool))
        
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
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or fps <= 0:
            fps = 25.0
        frame_delay = 1.0 / fps
            
        while self.running:
            start_t = time.time()
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            with self.frame_lock:
                self.latest_frame = frame
                # If annotated frame isn't ready yet, use raw
                if self.annotated_frame is None:
                    self.annotated_frame = frame.copy()
            
            elapsed = time.time() - start_t
            sleep_time = frame_delay - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)
            
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
                pose_results = self.pose_model.predict(frame, conf=0.3, classes=[0], imgsz=640, verbose=False, agnostic_nms=True)[0]
                # Object Model (Lightweight)
                obj_results = self.object_model.predict(frame, conf=0.25, classes=[67, 73], verbose=False)[0]
                
            annotated_frame = frame.copy()
            
            # Extract detections for Tracker
            if pose_results.boxes is not None and len(pose_results.boxes) > 0:
                # Update tracking state using pose_results.boxes directly
                tracks = self.tracker.update(pose_results.boxes, frame)
                
                # Mapping original boxes to tracks using IoU
                track_ids = []
                track_boxes = []
                if len(tracks) > 0:
                    for track in tracks:
                        if isinstance(track, np.ndarray):
                            # Ultralytics tracker returns [x1, y1, x2, y2, track_id, conf, cls, ...]
                            track_ids.append(int(track[4]))
                            track_boxes.append(track[0:4])
                        else:
                            track_ids.append(track.track_id)
                            track_boxes.append(track.tlbr) # [x1, y1, x2, y2]
                    
                pose_boxes = []
                pose_kpts = []
                if pose_results.boxes is not None and len(pose_results.boxes) > 0:
                    pose_boxes = pose_results.boxes.xyxy.cpu().numpy()
                    if hasattr(pose_results, 'keypoints') and pose_results.keypoints is not None:
                        pose_kpts = pose_results.keypoints.data.cpu().numpy()

                def bb_iou(boxA, boxB):
                    xA = max(boxA[0], boxB[0])
                    yA = max(boxA[1], boxB[1])
                    xB = min(boxA[2], boxB[2])
                    yB = min(boxA[3], boxB[3])
                    interArea = max(0, xB - xA) * max(0, yB - yA)
                    if interArea == 0:
                        return 0.0
                    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
                    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
                    return interArea / float(boxAArea + boxBArea - interArea)

                students_data = []
                for tid, tbox in zip(track_ids, track_boxes):
                    x1, y1, x2, y2 = map(int, tbox)
                    student_str_id = f"student{tid}"
                    
                    best_iou = 0.5
                    best_kpt = None
                    for pbox, pkpt in zip(pose_boxes, pose_kpts):
                        iou = bb_iou(tbox, pbox)
                        if iou > best_iou:
                            best_iou = iou
                            best_kpt = pkpt
                            
                    features = {
                        "timestamp": current_video_time,
                        "box": [x1, y1, x2, y2]
                    }
                    
                    if best_kpt is not None:
                        pose_dict = get_head_orientation_and_hand_positions(best_kpt)
                        features.update(pose_dict)
                        
                        features['nose'] = (float(best_kpt[0][0]), float(best_kpt[0][1]))
                        features['left_shoulder'] = (float(best_kpt[5][0]), float(best_kpt[5][1]))
                        features['right_shoulder'] = (float(best_kpt[6][0]), float(best_kpt[6][1]))
                        
                        ls = features['left_shoulder']
                        rs = features['right_shoulder']
                        if ls[0] != 0 and rs[0] != 0:
                            features['shoulder_angle'] = math.degrees(math.atan2(ls[1] - rs[1], ls[0] - rs[0]))
                        
                        if len(self.student_history[tid]) > 0:
                            prev = self.student_history[tid][-1]
                            curr_lw = features.get('left_hand', (0,0))
                            prev_lw = prev.get('left_hand', (0,0))
                            if curr_lw != (0,0) and prev_lw != (0,0):
                                dist = math.hypot(curr_lw[0] - prev_lw[0], curr_lw[1] - prev_lw[1])
                                features['hand_movement'] = float(dist)
                            else:
                                features['hand_movement'] = 0.0
                        else:
                            features['hand_movement'] = 0.0
                            
                    self.student_history[tid].append(features)
                    
                    history = list(self.student_history[tid])
                    detected_behaviors = []
                    
                    if len(history) >= 5:
                        alerts = [
                            self.behavior_engine.detect_sideward_glances(history),
                            self.behavior_engine.detect_excessive_head_turns(history),
                            self.behavior_engine.detect_body_rotation(history),
                            self.behavior_engine.detect_unusual_hand_movements(history),
                            self.behavior_engine.detect_nonverbal_communication(history)
                        ]
                        
                        for a in alerts:
                            behavior_name = a['behavior']
                            
                            if a['detected']:
                                if not self.alert_states[student_str_id][behavior_name]:
                                    self.alert_states[student_str_id][behavior_name] = True
                                    self._trigger_alert(student_str_id, a)
                                detected_behaviors.append(behavior_name)
                            else:
                                self.alert_states[student_str_id][behavior_name] = False
                    
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 0, 0), 1)
                    label = f"ID: {tid}"
                    if features.get('head_orientation') in ["Left", "Right"]:
                        label += f" | {features['head_orientation']} Glance"
                    if "body_rotation" in detected_behaviors:
                        label += " | Body Rotated"
                        
                    cv2.putText(annotated_frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,0,0), 1)
                    
                    # Draw Pose Skeleton
                    if best_kpt is not None:
                        # Common coco connections
                        skeleton = [(5,7), (7,9), (6,8), (8,10), (5,6)] 
                        for point in best_kpt:
                            px, py = int(point[0]), int(point[1])
                            if px != 0 and py != 0:
                                cv2.circle(annotated_frame, (px, py), 3, (0, 255, 0), -1)
                        for u, v in skeleton:
                            if u < len(best_kpt) and v < len(best_kpt):
                                p1 = (int(best_kpt[u][0]), int(best_kpt[u][1]))
                                p2 = (int(best_kpt[v][0]), int(best_kpt[v][1]))
                                if p1 != (0,0) and p2 != (0,0):
                                    cv2.line(annotated_frame, p1, p2, (0, 200, 0), 2)

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
                            if not self.alert_states[assigned_id][behavior_name]:
                                self.alert_states[assigned_id][behavior_name] = True
                                alert = {
                                    'behavior': behavior_name,
                                    'confidence': float(obj['confidence']),
                                    'reason': f"Detected {obj['class_name']}"
                                }
                                self._trigger_alert(assigned_id, alert)
                            # To keep it simple, objects only clear when they go missing from linking, 
                            # which we'd handle globally. For now, rely on object presence.
                                
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
        # Save to DB first to get the auto-generated ID
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
            db.refresh(db_event)
            
            # Save snapshot
            if self.annotated_frame is not None:
                os.makedirs("outputs/snapshots", exist_ok=True)
                snapshot_filename = f"outputs/snapshots/event_{db_event.id}.jpg"
                cv2.imwrite(snapshot_filename, self.annotated_frame)
            
            event_payload = {
                'id': db_event.id,
                'source_id': self.source_id,
                'student_id': student_id,
                'behaviour_type': alert['behavior'],
                'confidence': alert['confidence'],
                'explanation': alert['reason'],
                'timestamp': str(db_event.timestamp)
            }
            self.redis_client.publish('alerts', json.dumps(event_payload))
            
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
        
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        self.redis_client = redis.Redis.from_url(redis_url)
        
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

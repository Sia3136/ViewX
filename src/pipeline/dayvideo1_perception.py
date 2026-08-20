from ultralytics import YOLO
import cv2
import os
import time
import numpy as np
from collections import defaultdict, deque

from src.behaviour.behaviour import BehaviorEngine
from src.detection.object_detector import ProhibitedObjectDetector, link_objects_to_students
from src.alerts.alert import AlertManager
from src.utils.logger import EventLogger
from src.utils.schemas import BehaviourEvent

alert_logs = []
alert_cooldown = defaultdict(int)   # keeps alert alive for some frames
# ====================== FUNCTION ======================
def get_student_features(student_history, student_turns):
    pass # Replaced by direct behavior engine calls

# ====================== CONFIG ======================
VIDEO_PATH = "data/videos/Video1.mkv"
OUTPUT_PATH = "outputs/day3_output.mp4"
MODEL_NAME = "yolov8s-pose.pt"
CONFIDENCE = 0.49
HISTORY_LENGTH = 60
# ====================================================

SKELETON = [
    [0, 1], [0, 2], [1, 3], [2, 4],
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
    [5, 11], [6, 12], [11, 12],
    [11, 13], [13, 15], [12, 14], [14, 16]
]

os.makedirs("outputs", exist_ok=True)

model = YOLO(MODEL_NAME)
cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print(f"❌ Cannot open video: {VIDEO_PATH}")
    exit()

width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps    = int(cap.get(cv2.CAP_PROP_FPS)) or 25

out = cv2.VideoWriter(OUTPUT_PATH, cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

engine = BehaviorEngine()
object_detector = ProhibitedObjectDetector()
alert_manager = AlertManager()
event_logger = EventLogger()

student_history = defaultdict(lambda: deque(maxlen=HISTORY_LENGTH))
student_turns = defaultdict(int)
last_direction = {}
active_alerts = {}

print("🚀 Day 3 Pipeline Started...")
frame_count = 0
prev_time = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    video_timestamp = frame_count / fps
    annotated_frame = frame.copy()

    results = model.track(
        frame,
        conf=CONFIDENCE,
        persist=True,
        tracker="custom_bytetrack.yaml",
        imgsz=640,
        verbose=False,
        agnostic_nms=True
    )

    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.int().cpu().tolist()
        keypoints = results[0].keypoints.xy.cpu().numpy()

        for box, track_id, kpts in zip(boxes, track_ids, keypoints):
            x1, y1, x2, y2 = map(int, box)

            # ---------- Extract keypoints ----------
            nose = kpts[0]
            left_shoulder = kpts[5]
            right_shoulder = kpts[6]
            left_wrist = kpts[9]
            right_wrist = kpts[10]

            # Head Direction
            shoulder_center_x = (left_shoulder[0] + right_shoulder[0]) / 2
            head_offset = nose[0] - shoulder_center_x

            if head_offset > 20:
                direction = "Right"
            elif head_offset < -20:
                direction = "Left"
            else:
                direction = "Center"

            # Body Rotation
            shoulder_dx = right_shoulder[0] - left_shoulder[0]
            shoulder_dy = right_shoulder[1] - left_shoulder[1]
            shoulder_angle = np.degrees(np.arctan2(shoulder_dy, shoulder_dx))

            # Hand Movement
            hand_movement = 0
            if track_id in student_history and len(student_history[track_id]) > 5:
                prev = student_history[track_id][-1]
                if "left_wrist" in prev:
                    lw_dist = np.linalg.norm(left_wrist - prev["left_wrist"])
                    rw_dist = np.linalg.norm(right_wrist - prev["right_wrist"])
                    hand_movement = lw_dist + rw_dist

            # Turn counting
            if track_id not in last_direction:
                last_direction[track_id] = direction
            else:
                if direction != last_direction[track_id] and direction != "Center":
                    student_turns[track_id] += 1
                last_direction[track_id] = direction

            # Save features
            features = {
                "timestamp": video_timestamp,
                "head_orientation": direction,
                "head_offset": head_offset,
                "shoulder_angle": shoulder_angle,
                "left_hand": (int(left_wrist[0]), int(left_wrist[1])),
                "right_hand": (int(right_wrist[0]), int(right_wrist[1])),
                "nose": (int(nose[0]), int(nose[1])),
                "hand_movement": hand_movement,
                "box": [x1, y1, x2, y2]
            }
            student_history[track_id].append(features)

            # ---------- Drawing ----------
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated_frame, f"ID: {track_id}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            for kx, ky in kpts:
                if kx > 0 and ky > 0:
                    cv2.circle(annotated_frame, (int(kx), int(ky)), 3, (0, 0, 255), -1)

            for i, j in SKELETON:
                if (kpts[i][0] > 0 and kpts[i][1] > 0 and kpts[j][0] > 0 and kpts[j][1] > 0):
                    pt1 = (int(kpts[i][0]), int(kpts[i][1]))
                    pt2 = (int(kpts[j][0]), int(kpts[j][1]))
                    cv2.line(annotated_frame, pt1, pt2, (255, 255, 0), 2)

            cv2.putText(annotated_frame, f"Head: {direction}", (x1, y2 + 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 2)
            cv2.putText(annotated_frame, f"Turns: {student_turns[track_id]}", (x1, y2 + 38),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
            cv2.putText(annotated_frame, f"Hand Move: {int(hand_movement)}", (x1, y2 + 58),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 150, 0), 2)

            # Show Alert
                        # Show Alert (better visibility)
            if track_id in active_alerts:
                # Draw red background rectangle for alert
                cv2.rectangle(annotated_frame, (x1, y1 - 55), (x1 + 280, y1 - 25), (0, 0, 255), -1)
                cv2.putText(annotated_frame, active_alerts[track_id],
                            (x1 + 5, y1 - 35),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    # Object detection
    obj_results = object_detector.detect_objects(frame, conf_threshold=0.25)
    
    students_data = [{"id": sid, "box": history[-1]["box"]} for sid, history in student_history.items() if history]
    linked_objects = link_objects_to_students(obj_results, students_data)

    # Object alerts
    for obj in linked_objects:
        obj_x1, obj_y1, obj_x2, obj_y2 = obj['box']
        cv2.rectangle(annotated_frame, (obj_x1, obj_y1), (obj_x2, obj_y2), (0, 165, 255), 2)
        cv2.putText(annotated_frame, f"{obj['class_name']}", (obj_x1, obj_y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)
        
        sid = obj['assigned_student_id']
        if sid != "unassigned":
            cooldown_key = (sid, "prohibited_object")
            if alert_cooldown[cooldown_key] <= 0:
                event = BehaviourEvent(
                    student_id=str(sid),
                    behaviour_type="prohibited_object",
                    confidence=obj['association_confidence'],
                    explanation=f"Prohibited {obj['class_name']} detected near Student {sid}.",
                    timestamp=video_timestamp,
                    frame_number=frame_count,
                    evidence={"object": obj['class_name'], "object_conf": obj['confidence']}
                )
                formatted_alert = alert_manager.create_alert(event)
                if formatted_alert:
                    event_logger.log_event(formatted_alert)
                    active_alerts[sid] = alert_manager.format_alert(event)
                    alert_cooldown[cooldown_key] = int(fps * 3)

    # Behaviour alerts
    for sid, history in student_history.items():
        if not history:
            continue
            
        history_list = list(history)
        
        detectors = [
            engine.detect_sideward_glances,
            engine.detect_excessive_head_turns,
            engine.detect_body_rotation,
            engine.detect_unusual_hand_movements,
            engine.detect_nonverbal_communication
        ]
        
        for detector in detectors:
            result = detector(history_list)
            if result["detected"]:
                behavior_type = result["behavior"]
                cooldown_key = (sid, behavior_type)
                
                if alert_cooldown[cooldown_key] <= 0:
                    event = BehaviourEvent(
                        student_id=str(sid),
                        behaviour_type=behavior_type,
                        confidence=result["confidence"],
                        explanation=f"Observed: {result['reason']}",
                        timestamp=video_timestamp,
                        frame_number=frame_count,
                        evidence={}
                    )
                    formatted_alert = alert_manager.create_alert(event)
                    if formatted_alert:
                        event_logger.log_event(formatted_alert)
                        active_alerts[sid] = alert_manager.format_alert(event)
                        alert_cooldown[cooldown_key] = int(fps * 3)

        # Manage active_alerts expiration
        if sid in active_alerts:
            if all(alert_cooldown[(sid, b)] <= 0 for b in ["repeated_sideward_glance", "excessive_head_turning", "body_rotation", "unusual_hand_movement", "nonverbal_communication", "prohibited_object"]):
                del active_alerts[sid]

    # Decrease all cooldowns
    for key in list(alert_cooldown.keys()):
        if alert_cooldown[key] > 0:
            alert_cooldown[key] -= 1

    # FPS
    curr_time = time.time()
    fps_text = 1 / (curr_time - prev_time + 1e-6)
    prev_time = curr_time
    cv2.putText(annotated_frame, f"FPS: {int(fps_text)}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    out.write(annotated_frame)
    cv2.imshow("Day 3 Pipeline", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
out.release()
cv2.destroyAllWindows()

print("\n✅ Finished!")
from ultralytics import YOLO
import cv2
import os
import time
import numpy as np
from collections import defaultdict, deque
from src.utils.feedback import FeedbackManager


from src.behaviour.behaviour import BehaviorEngine
from src.detection.object_detector import ProhibitedObjectDetector, link_objects_to_students
from src.alerts.alert import AlertManager
from src.utils.logger import EventLogger
from src.utils.schemas import BehaviourEvent

# ====================== CONFIG ======================
from pathlib import Path

def remove_duplicate_tracks(boxes, track_ids, keypoints, iou_thresh=0.45):
    """Keep one track when two boxes overlap a lot (same person, two IDs)"""
    if len(boxes) <= 1:
        return boxes, track_ids, keypoints

    keep = [True] * len(boxes)

    for i in range(len(boxes)):
        if not keep[i]:
            continue
        for j in range(i + 1, len(boxes)):
            if not keep[j]:
                continue

            xA = max(boxes[i][0], boxes[j][0])
            yA = max(boxes[i][1], boxes[j][1])
            xB = min(boxes[i][2], boxes[j][2])
            yB = min(boxes[i][3], boxes[j][3])

            inter = max(0, xB - xA) * max(0, yB - yA)
            area_i = (boxes[i][2] - boxes[i][0]) * (boxes[i][3] - boxes[i][1])
            area_j = (boxes[j][2] - boxes[j][0]) * (boxes[j][3] - boxes[j][1])
            iou = inter / (area_i + area_j - inter + 1e-6)

            if iou > iou_thresh:
                keep[j] = False

    boxes = boxes[keep]
    track_ids = [tid for tid, k in zip(track_ids, keep) if k]
    keypoints = keypoints[keep]
    return boxes, track_ids, keypoints

def is_looking_towards_invigilator(student_box, head_orientation, invigilator_boxes):
    """
    Returns True if student is looking in the direction of an invigilator.
    """
    if not invigilator_boxes or head_orientation == "Center":
        return False

    sx = (student_box[0] + student_box[2]) / 2.0

    for ib in invigilator_boxes:
        ix = (ib[0] + ib[2]) / 2.0

        # Student looking left, invigilator is on the left
        if head_orientation == "Left" and ix < sx - 20:
            return True

        # Student looking right, invigilator is on the right
        if head_orientation == "Right" and ix > sx + 20:
            return True

    return False

def is_likely_invigilator(kpts, box, frame_height):
    """
    Balanced check:
    - Standing invigilator → True
    - Seated student → False
    """
    x1, y1, x2, y2 = box
    bbox_height = y2 - y1
    bbox_width = max(x2 - x1, 1)
    height_ratio = bbox_height / max(frame_height, 1)
    aspect = bbox_height / bbox_width

    nose = kpts[0] if len(kpts) > 0 else (0, 0)
    left_hip = kpts[11] if len(kpts) > 11 else (0, 0)
    right_hip = kpts[12] if len(kpts) > 12 else (0, 0)
    left_ankle = kpts[15] if len(kpts) > 15 else (0, 0)
    right_ankle = kpts[16] if len(kpts) > 16 else (0, 0)
    left_knee = kpts[13] if len(kpts) > 13 else (0, 0)
    right_knee = kpts[14] if len(kpts) > 14 else (0, 0)

    head_pos = nose[1] / frame_height if nose[1] > 0 else 1.0

    hips_visible = left_hip[0] > 0 and right_hip[0] > 0
    ankles_visible = left_ankle[0] > 0 or right_ankle[0] > 0
    knees_visible = left_knee[0] > 0 or right_knee[0] > 0

    # Hip position inside the box (0 = top of box, 1 = bottom)
    if hips_visible:
        hip_y = (left_hip[1] + right_hip[1]) / 2.0
        hip_rel = (hip_y - y1) / max(bbox_height, 1)
    else:
        hip_rel = 0.5

    # ----- Standing signals -----
    # Standing: taller box, head higher, hips roughly mid-body, legs visible
    standing_score = 0

    if height_ratio > 0.52:
        standing_score += 2
    if height_ratio > 0.45 and aspect > 1.55:
        standing_score += 1
    if head_pos < 0.28:
        standing_score += 1
    if ankles_visible or knees_visible:
        standing_score += 1
    if hips_visible and 0.35 <= hip_rel <= 0.60:
        standing_score += 1   # hips in middle → more standing-like

    # ----- Seated rejection -----
    # Seated: shorter in frame, head lower, hips lower in box
    if height_ratio < 0.42:
        return False
    if head_pos > 0.40 and height_ratio < 0.55:
        return False
    if hips_visible and hip_rel > 0.65 and height_ratio < 0.55:
        return False   # hips near bottom of box → sitting

    return standing_score >= 3
invigilator_ids = set()
invigilator_boxes = []
PROJECT_ROOT = Path(__file__).resolve().parents[2]

VIDEO_PATH = PROJECT_ROOT / "src" / "data" / "videos" / "Video3.mkv"
OUTPUT_PATH = "outputs/day3_output.mp4"
MODEL_NAME = "yolov8s-pose.pt"
CONFIDENCE = 0.45
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
event_logger = EventLogger(
    json_path="outputs/events.json",
    csv_path="outputs/events.csv"
)

student_history = defaultdict(lambda: deque(maxlen=HISTORY_LENGTH))
student_turns = defaultdict(int)
last_direction = {}
active_alerts = {}
alert_cooldown = defaultdict(int)

print("🚀 Pipeline Started...")
frame_count = 0
prev_time = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    video_timestamp = frame_count / fps
    annotated_frame = frame.copy()

    if frame_count % 2 !=0:
        out.write(annotated_frame)
        continue

    results = model.track(
        frame,
        conf=CONFIDENCE,
        persist=True,
        tracker="custom_bytetrack.yaml",
        imgsz=480,
        verbose=False,
        agnostic_nms=True
    )

    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.int().cpu().tolist()
        keypoints = results[0].keypoints.xy.cpu().numpy()
        boxes, track_ids, keypoints = remove_duplicate_tracks(boxes, track_ids, keypoints)
        

        for box, track_id, kpts in zip(boxes, track_ids, keypoints):
            x1, y1, x2, y2 = map(int, box)

            if track_id in invigilator_ids or is_likely_invigilator(kpts, [x1, y1, x2, y2], height):
                invigilator_ids.add(track_id)   # lock this ID as invigilator
                invigilator_boxes.append([x1, y1, x2, y2])
                active_alerts.pop(track_id, None)

        # clear any old student alerts/history
                if track_id in active_alerts:
                    del active_alerts[track_id]
                if track_id in student_history:
                    student_history[track_id].clear()

                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 150, 0), 2)
                cv2.putText(annotated_frame, "Invigilator", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 150, 0), 2)
                continue
            

            if is_likely_invigilator(kpts, [x1, y1, x2, y2], height):
                if track_id in active_alerts:
                    del active_alerts[track_id]
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (173, 216, 230), 2)
                cv2.putText(annotated_frame, "Invigilator", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 150, 0), 2)
                continue

            # Extract keypoints
            nose = kpts[0]
            left_shoulder = kpts[5]
            right_shoulder = kpts[6]
            left_wrist = kpts[9]
            right_wrist = kpts[10]

            # Head Direction
            shoulder_center_x = (left_shoulder[0] + right_shoulder[0]) / 2
            head_offset = nose[0] - shoulder_center_x

            if head_offset > 18:
                direction = "Right"
            elif head_offset < -18:
                direction = "Left"
            else:
                direction = "Center"

            # Shoulder Angle
            shoulder_dx = right_shoulder[0] - left_shoulder[0]
            shoulder_dy = right_shoulder[1] - left_shoulder[1]
            shoulder_angle = np.degrees(np.arctan2(shoulder_dy, shoulder_dx))

            # Hand Movement
            hand_movement = 0
            if track_id in student_history and len(student_history[track_id]) > 3:
                prev = student_history[track_id][-1]
                if "left_hand" in prev:
                    lw_dist = np.linalg.norm(left_wrist - np.array(prev["left_hand"]))
                    rw_dist = np.linalg.norm(right_wrist - np.array(prev["right_hand"]))
                    hand_movement = lw_dist + rw_dist

            # Turn counting
            if track_id not in last_direction:
                last_direction[track_id] = direction
            else:
                if direction != last_direction[track_id] and direction != "Center":
                    student_turns[track_id] += 1
                last_direction[track_id] = direction

            # Save features (Siya format)
            features = {
                "timestamp": video_timestamp,
                "head_orientation": direction,
                "head_offset": float(head_offset),
                "shoulder_angle": float(shoulder_angle),
                "left_shoulder": (int(left_shoulder[0]), int(left_shoulder[1])),
                "right_shoulder": (int(right_shoulder[0]), int(right_shoulder[1])),
                "left_hand": (int(left_wrist[0]), int(left_wrist[1])),
                "right_hand": (int(right_wrist[0]), int(right_wrist[1])),
                "nose": (int(nose[0]), int(nose[1])),
                "hand_movement": float(hand_movement),
                "box": [x1, y1, x2, y2]
            }
            student_history[track_id].append(features)

            # ========== DRAWING ==========
            box_color = (0, 0, 255) if track_id in active_alerts else (0, 255, 0)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, 2)
            cv2.putText(annotated_frame, f"ID: {track_id}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, box_color, 2)

            # Skeleton
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

            # ========== ALERT DRAWING ==========
            if track_id in active_alerts:
                alert_text = str(active_alerts[track_id])
                if len(alert_text) > 55:
                    alert_text = alert_text[:52] + "..."

                (tw, th), _ = cv2.getTextSize(alert_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                cv2.rectangle(annotated_frame, (x1, y1 - 65), (x1 + tw + 12, y1 - 25), (0, 0, 255), -1)
                cv2.putText(annotated_frame, alert_text, (x1 + 5, y1 - 40),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

    # ========== OBJECT DETECTION ==========
    obj_results = object_detector.detect_objects(frame, conf_threshold=0.28)
    if obj_results:
        print("Objects found:", [(obj['class_name'], round(obj['confidence'], 2)) for obj in obj_results])
    students_data = []
    for sid, history in student_history.items():
        if history:
            students_data.append({
                "id": sid,
                "box": history[-1]["box"],
                "left_hand": history[-1].get("left_hand", (0, 0)),
                "right_hand": history[-1].get("right_hand", (0, 0))
            })

    linked_objects = link_objects_to_students(obj_results, students_data)

    for obj in linked_objects:
        obj_x1, obj_y1, obj_x2, obj_y2 = map(int, obj['box'])
        cv2.rectangle(annotated_frame, (obj_x1, obj_y1), (obj_x2, obj_y2), (0, 165, 255), 2)
        cv2.putText(annotated_frame, obj['class_name'], (obj_x1, obj_y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)

        sid = obj['assigned_student_id']
        if sid != "unassigned":
            cooldown_key = (sid, "prohibited_object")
            if alert_cooldown[cooldown_key] <= 0:
                event = BehaviourEvent(
                    student_id=str(sid),
                    behaviour_type="prohibited_object",
                    confidence=obj.get('association_confidence', 0.7),
                    explanation=f"Prohibited {obj['class_name']} detected near Student {sid}.",
                    timestamp=video_timestamp,
                    frame_number=frame_count,
                    evidence={"object": obj['class_name']}
                )
                if alert_manager.create_alert(event):
                    event_logger.log_event({
                    "student_id": str(event.student_id),
                    "behaviour_type": str(event.behaviour_type),
                    "confidence": float(event.confidence),
                    "explanation": str(event.explanation),
                    "timestamp": float(event.timestamp),
                    "keypoints_snapshot": {}
})
                    active_alerts[sid] = f"Prohibited Object | Conf: {int(event.confidence*100)}%"
                    alert_cooldown[cooldown_key] = int(fps * 3)

    # ========== BEHAVIOUR ALERTS (Siya) ==========
    for sid, history in student_history.items():
        if len(history) < 10:
            continue

        history_list = list(history)

        detectors = [
            engine.detect_sideward_glances,
            engine.detect_excessive_head_turns,
            engine.detect_body_rotation,
            engine.detect_unusual_hand_movements,
            engine.detect_nonverbal_communication,
            engine.detect_staring_at_neighbour_paper
            
        ]

        for detector in detectors:
            result = detector(history_list)
            behavior_type = result["behavior"]

            if behavior_type == "staring_at_neighbour_paper":
                latest = history_list[-1]
                student_box = latest.get("box", [0, 0, 0, 0])
                head_ori = latest.get("head_orientation", "Center")

                if is_looking_towards_invigilator(student_box, head_ori, invigilator_boxes):
                    continue
                
            if result["detected"]:
                behavior_type = result["behavior"]
                cooldown_key = (sid, behavior_type)

                if alert_cooldown[cooldown_key] <= 0:
                    event = BehaviourEvent(
                        student_id=str(sid),
                        behaviour_type=behavior_type,
                        confidence=result["confidence"],
                        explanation=result["reason"],
                        timestamp=video_timestamp,
                        frame_number=frame_count,
                        evidence={}
                    )
                    if alert_manager.create_alert(event):
                        event_logger.log_event({
                        "student_id": str(event.student_id),
                        "behaviour_type": str(event.behaviour_type),
                        "confidence": float(event.confidence),
                        "explanation": str(event.explanation),
                        "timestamp": float(event.timestamp),
                        "keypoints_snapshot": {}
})
                        active_alerts[sid] = f"{behavior_type} | Conf: {int(result['confidence']*100)}%"
                        alert_cooldown[cooldown_key] = int(fps * 3)
                        feedback_mgr = FeedbackManager()
                        if result["detected"]:
                            penalty = feedback_mgr.get_confidence_penalty(result["behavior"])
                            adjusted_conf = result["confidence"] * (1.0 - penalty)

                            if adjusted_conf < 0.55:      # suppress weak alerts after feedback
                                continue

    # Decrease cooldowns
    for key in list(alert_cooldown.keys()):
        if alert_cooldown[key] > 0:
            alert_cooldown[key] -= 1
        else:
            # Clean up expired alerts
            sid = key[0] if isinstance(key, tuple) else key
            if sid in active_alerts and alert_cooldown[key] <= 0:
                # Only delete if no other active cooldowns for this student
                pass

    # FPS
    curr_time = time.time()
    fps_text = 1 / (curr_time - prev_time + 1e-6)
    prev_time = curr_time
    cv2.putText(annotated_frame, f"FPS: {int(fps_text)}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    out.write(annotated_frame)
    cv2.imshow("Exam Monitoring", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
out.release()
cv2.destroyAllWindows()
print("\n✅ Finished!")


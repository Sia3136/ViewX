from ultralytics import YOLO
import cv2
import os
import time
import numpy as np
from collections import defaultdict, deque
from src.utils.feedback import FeedbackManager
from src.tracking.multi_camera_reid import MultiCameraReID

from src.behaviour.behaviour import BehaviorEngine
from src.detection.object_detector import ProhibitedObjectDetector, link_objects_to_students
from src.alerts.alert import AlertManager
from src.utils.logger import EventLogger
from src.utils.schemas import BehaviourEvent

# ====================== CONFIG ======================
from pathlib import Path

import math

SEVERITY = {
    "prohibited_object": "CRITICAL",
    "sustained_neighbour_gaze": "HIGH",
    "staring_at_neighbour_paper": "HIGH",
    "lean_and_look": "HIGH",
    "repeated_sideward_glance": "MEDIUM",
    "excessive_head_turning": "MEDIUM",
    "nonverbal_communication": "MEDIUM",
    "body_rotation": "LOW",
    "unusual_hand_movement": "LOW",
    "student_standing": "LOW",
}

FRIENDLY = {
    "prohibited_object": "Phone/Object",
    "sustained_neighbour_gaze": "Sustained Gaze",
    "staring_at_neighbour_paper": "Staring at Paper",
    "lean_and_look": "Lean and Look",
    "repeated_sideward_glance": "Side Glances",
    "excessive_head_turning": "Head Turning",
    "nonverbal_communication": "Non-verbal",
    "body_rotation": "Body Rotation",
    "unusual_hand_movement": "Hand Movement",
    "student_standing": "Student Standing",
}

def enhance_lighting(frame):
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l2 = clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l2, a, b]), cv2.COLOR_LAB2BGR)


def _valid(pt):
    return pt is not None and pt[0] > 0 and pt[1] > 0

def _dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])

def _angle_at_vertex(vertex, p1, p2):
    """Angle at `vertex` formed by points p1-vertex-p2 (degrees)."""
    if not (_valid(vertex) and _valid(p1) and _valid(p2)):
        return None
    a = _dist(vertex, p1)
    b = _dist(vertex, p2)
    c = _dist(p1, p2)
    if a < 1e-6 or b < 1e-6:
        return None
    cos_a = (a*a + b*b - c*c) / (2 * a * b)
    cos_a = max(-1.0, min(1.0, cos_a))
    return math.degrees(math.acos(cos_a))

def draw_alert_panel(frame, active_alerts, panel_width=320):
    """
    Draw a clean right-side panel with stacked alerts.
    active_alerts: {student_id: "message string" or dict}
    """
    h, w = frame.shape[:2]
    panel_w = min(panel_width, w // 3)

    # Dark panel background
    overlay = frame.copy()
    cv2.rectangle(overlay, (w - panel_w, 0), (w, h), (30, 30, 30), -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

    # Title
    cv2.putText(frame, "ALERTS", (w - panel_w + 15, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)
    cv2.line(frame, (w - panel_w + 10, 45), (w - 10, 45), (80, 80, 80), 1)

    y = 75
    if not active_alerts:
        cv2.putText(frame, "No active alerts", (w - panel_w + 15, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 180), 1)
        return frame

    for sid, msg in list(active_alerts.items())[:12]:  # max 12 rows
        text = f"ID {sid}: {msg}"
        # wrap long text
        if len(text) > 42:
            text = text[:39] + "..."
        
     

        # alert row background
        cv2.rectangle(frame, (w - panel_w + 8, y - 18), (w - 8, y + 8), (0, 0, 180), -1)
        cv2.putText(frame, text, (w - panel_w + 12, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        y += 32

        if y > h - 20:
            break

    return frame

def compute_dual_triangle_head_pose(kpts):
    """
    Dual-triangle head pose (inspired by Haider et al. 2025).
    Triangle 1: nose – left_eye – right_eye
    Triangle 2: nose – left_ear – right_ear

    Returns dict with angles and a simple Left/Right/Center estimate.
    """
    nose = kpts[0]
    left_eye, right_eye = kpts[1], kpts[2]
    left_ear, right_ear = kpts[3], kpts[4]
    left_shoulder, right_shoulder = kpts[5], kpts[6]

    # --- Angles at nose ---
    eye_angle = _angle_at_vertex(nose, left_eye, right_eye)    # smaller when face turns
    ear_angle = _angle_at_vertex(nose, left_ear, right_ear)

    # --- Side asymmetry (strong signal for left/right turn) ---
    # Horizontal offset of nose relative to eye midpoint and ear midpoint
    eye_mid_x = None
    ear_mid_x = None
    if _valid(left_eye) and _valid(right_eye):
        eye_mid_x = (left_eye[0] + right_eye[0]) / 2.0
    if _valid(left_ear) and _valid(right_ear):
        ear_mid_x = (left_ear[0] + right_ear[0]) / 2.0

    nose_x = nose[0] if _valid(nose) else None

    eye_offset = (nose_x - eye_mid_x) if (nose_x is not None and eye_mid_x is not None) else 0.0
    ear_offset = (nose_x - ear_mid_x) if (nose_x is not None and ear_mid_x is not None) else 0.0

    # Shoulder-normalized offset (scale-invariant)
    shoulder_w = 1.0
    if _valid(left_shoulder) and _valid(right_shoulder):
        shoulder_w = max(_dist(left_shoulder, right_shoulder), 1.0)

    norm_eye_offset = eye_offset / shoulder_w
    norm_ear_offset = ear_offset / shoulder_w

    # Combined turn score: positive → looking right, negative → looking left
    turn_score = 0.6 * norm_eye_offset + 0.4 * norm_ear_offset

    # Direction label (rough, threshold refined dynamically later)
    if turn_score > 0.08:
        direction = "Right"
    elif turn_score < -0.08:
        direction = "Left"
    else:
        direction = "Center"

    return {
        "eye_angle": eye_angle,
        "ear_angle": ear_angle,
        "norm_eye_offset": norm_eye_offset,
        "norm_ear_offset": norm_ear_offset,
        "turn_score": turn_score,
        "direction": direction,
        "shoulder_width": shoulder_w,
    }

# Near top, with other state
head_score_history = defaultdict(lambda: deque(maxlen=90))  # ~3 sec at 30fps
DYNAMIC_BASE = 0.12          # base |turn_score| threshold
DYNAMIC_STD_MULT = 1.5       # how much extra from person's own variation


import os
from datetime import datetime

import cv2, os

# === MULTI-CAMERA GLOBAL ID SETUP (change these to your real camera positions) ===
multi_reid = MultiCameraReID(
    camera_positions=[(100, 200), (800, 150)],   # <-- PUT YOUR ACTUAL CAMERA COORDINATES HERE
    reid_threshold=0.75
)

VIDEO = "data/videos/Video1.mkv"
OUT = "dataset/images/train"
os.makedirs(OUT, exist_ok=True)

cap = cv2.VideoCapture(VIDEO)
fps = cap.get(cv2.CAP_PROP_FPS) or 25
interval = int(fps)
i = saved = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    if i % interval == 0:
        cv2.imwrite(f"{OUT}/vid1_{saved:05d}.jpg", frame)
        saved += 1
    i += 1

cap.release()
print("Saved", saved)

os.makedirs("outputs/evidence", exist_ok=True)

def save_evidence(frame, box, student_id, behavior_type, ts):
    x1, y1, x2, y2 = map(int, box)
    h, w = frame.shape[:2]
    pad = 20
    x1, y1 = max(0, x1-pad), max(0, y1-pad)
    x2, y2 = min(w, x2+pad), min(h, y2+pad)
    crop = frame[y1:y2, x1:x2]
    fname = f"outputs/evidence/{student_id}_{behavior_type}_{ts:.1f}.jpg"
    cv2.imwrite(fname, crop)
    return fname

def get_dynamic_threshold(track_id, turn_score):
    """
    Dynamic threshold: person's recent motion + base.
    Looking at invigilator / natural sway is less likely to cross this.
    """
    hist = head_score_history[track_id]
    hist.append(turn_score)

    if len(hist) < 15:
        return DYNAMIC_BASE

    arr = np.array(hist)
    med = np.median(arr)
    std = np.std(arr)

    # Threshold is distance from this person's typical center
    thresh = max(DYNAMIC_BASE, abs(med) + DYNAMIC_STD_MULT * std)
    # Cap so it doesn't become huge
    thresh = min(thresh, 0.35)
    return thresh

def is_suspicious_head_turn(track_id, pose_info):
    score = pose_info["turn_score"]
    thresh = get_dynamic_threshold(track_id, score)
    direction = pose_info["direction"]

    if abs(score) >= thresh and direction in ("Left", "Right"):
        return True, direction, abs(score), thresh
    return False, direction, abs(score), thresh

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

def is_likely_invigilator(kpts, box, frame_height, all_height_ratios=None):
    """
    Standing invigilator check.
    all_height_ratios: list of height_ratio of every person in this frame (for relative check).
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

    head_pos = nose[1] / frame_height if nose[1] > 0 else 1.0
    ankles_visible = (left_ankle[0] > 0 or right_ankle[0] > 0)

    if left_hip[0] > 0 and right_hip[0] > 0:
        hip_y = (left_hip[1] + right_hip[1]) / 2.0
        hip_rel = (hip_y - y1) / max(bbox_height, 1)
    else:
        hip_rel = 0.5

    # Strong seated reject
    if height_ratio < 0.40:
        return False
    if head_pos > 0.38 and height_ratio < 0.55:
        return False
    if hip_rel > 0.65 and height_ratio < 0.55:
        return False

    standing_score = 0
    if height_ratio > 0.55:
        standing_score += 2
    if height_ratio > 0.48 and aspect > 1.45:
        standing_score += 1
    if head_pos < 0.28:
        standing_score += 2
    if ankles_visible and height_ratio > 0.48:
        standing_score += 1
    if 0.30 <= hip_rel <= 0.58:
        standing_score += 1

    # Relative: clearly taller than other people in frame
    if all_height_ratios and len(all_height_ratios) >= 2:
        median_h = float(np.median(all_height_ratios))
        if height_ratio > median_h * 1.25 and height_ratio > 0.42:
            standing_score += 2

    return standing_score >= 3 # need stronger evidence

def is_near_known_invigilator(box, invigilator_centers, max_dist=120):
    cx = (box[0] + box[2]) / 2.0
    cy = (box[1] + box[3]) / 2.0
    for (ix, iy) in invigilator_centers:
        if abs(cx - ix) < max_dist and abs(cy - iy) < max_dist:
            return True
    return False

multi_reid = MultiCameraReID(
    camera_positions=[(100, 200), (800, 150)],   # <--- PUT YOUR REAL CAMERA COORDINATES HERE
    reid_threshold=0.75
)

invigilator_ids = set()
invigilator_centers = []
invigilator_confirm = {}   # track_id → consecutive standing frames
sitting_confirm = {}       # track_id → consecutive sitting frames
invigilator_boxes = []
PROJECT_ROOT = Path(__file__).resolve().parents[2]

VIDEO_PATH = PROJECT_ROOT / "data" / "videos" / "Video3.mkv"
OUTPUT_PATH = str(PROJECT_ROOT / "outputs" / "day3_output.mp4")
print("VIDEO_PATH =", VIDEO_PATH)
print("Exists =", VIDEO_PATH.exists())
MODEL_NAME = "yolov8s-pose.pt"
CONFIDENCE = 0.3
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
feedback_mgr = FeedbackManager()

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

    invigilator_boxes = []
    frame_for_infer = enhance_lighting(frame)
    results = model.track(
        frame_for_infer,
        conf=CONFIDENCE,
        persist=True,
        tracker="custom_bytetrack.yaml",
        imgsz=960,
        verbose=False,
        agnostic_nms=True
    )

    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.int().cpu().tolist()
        keypoints = results[0].keypoints.xy.cpu().numpy()
        boxes, track_ids, keypoints = remove_duplicate_tracks(boxes, track_ids, keypoints)
        all_height_ratios = []
        temp_people = []

        for box, track_id, kpts in zip(boxes, track_ids, keypoints):
            x1, y1, x2, y2 = map(int, box)
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0

    # ===== INVIGILATOR (hard sticky + position memory) =====
            near_old = False
            for (ix, iy) in invigilator_centers:
                if abs(cx - ix) < 120 and abs(cy - iy) < 120:
                    near_old = True
                    break

            standing_now = is_likely_invigilator(kpts, [x1, y1, x2, y2], height)

            if track_id in invigilator_ids or near_old or standing_now:
                invigilator_ids.add(track_id)
                invigilator_centers.append((cx, cy))
                invigilator_centers = invigilator_centers[-5:]
                invigilator_boxes.append([x1, y1, x2, y2])

                active_alerts.pop(track_id, None)
                if track_id in student_history:
                    student_history[track_id].clear()

                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 150, 0), 1)
                cv2.putText(annotated_frame, "Invigilator", (x1, max(y1 - 6, 12)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 150, 0), 1)
                continue
    # ===== END INVIGILATOR =====

    # -------- STUDENT code only below this line --------
    # thin box + ID, features, history, etc.
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


            pose_info = compute_dual_triangle_head_pose(kpts)
            suspicious, direction, abs_score, thresh = is_suspicious_head_turn(track_id, pose_info)
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
                "box": [x1, y1, x2, y2],
                "direction": direction,                    # Left / Right / Center
                "turn_score": pose_info["turn_score"],
                "eye_angle": pose_info["eye_angle"],
                "ear_angle": pose_info["ear_angle"],
                "head_suspicious": suspicious,
                "dynamic_thresh": thresh,
            }
            student_history[track_id].append(features)
            height_ratio = (y2 - y1) / float(height)
            features["height_ratio"] = height_ratio
             

            # ========== DRAWING ==========
            box_color = (0, 0, 255) if track_id in active_alerts else (0, 255, 0)
            thickness = 1
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, thickness)
            cv2.putText(
    annotated_frame,
    f"ID:{track_id}",
    (x1, max(y1 - 6, 12)),
    cv2.FONT_HERSHEY_SIMPLEX,
    0.5,
    box_color,
    1
)

            # Skeleton
            for kx, ky in kpts:
                if kx > 0 and ky > 0:
                    cv2.circle(annotated_frame, (int(kx), int(ky)), 3, (0, 0, 255), -1)

            for i, j in SKELETON:
                if (kpts[i][0] > 0 and kpts[i][1] > 0 and kpts[j][0] > 0 and kpts[j][1] > 0):
                    pt1 = (int(kpts[i][0]), int(kpts[i][1]))
                    pt2 = (int(kpts[j][0]), int(kpts[j][1]))
                    cv2.line(annotated_frame, pt1, pt2, (255, 255, 0), 2)


            # ========== ALERT DRAWING ==========
            if track_id in active_alerts:
                alert_text = str(active_alerts[track_id])
                if len(alert_text) > 55:
                    alert_text = alert_text[:52] + "..."

                (tw, th), _ = cv2.getTextSize(alert_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                

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
            engine.detect_sustained_neighbour_gaze,   # keep this if it exists
            engine.detect_lean_and_look,              # only if you added it
            engine.detect_student_standing,
            
            
        ]

        for detector in detectors:
            result = detector(history_list)
            if not result.get("detected"):
                continue
            if result.get("confidence", 0) < 0.55:
                continue

            behavior_type = result["behavior"]

            if behavior_type in ("staring_at_neighbour_paper", "sustained_neighbour_gaze"):
                latest = history_list[-1]
                student_box = latest.get("box", [0, 0, 0, 0])
                head_ori = latest.get("head_orientation", "Center")
                if is_looking_towards_invigilator(student_box, head_ori, invigilator_boxes):
                    continue

            cooldown_key = (sid, behavior_type)
            if alert_cooldown[cooldown_key] > 0:
                continue

            box = history_list[-1]["box"]
            path = save_evidence(annotated_frame, box, sid, behavior_type, video_timestamp)
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
                sev = SEVERITY.get(behavior_type, "LOW")
                name = FRIENDLY.get(behavior_type, behavior_type)
                active_alerts[sid] = f"[{sev}] {name} | {int(result['confidence'] * 100)}%"
                alert_cooldown[cooldown_key] = int(fps * 3)

                penalty = feedback_mgr.get_confidence_penalty(result["behavior"])
                adjusted_conf = result["confidence"] * (1.0 - penalty)
                if adjusted_conf < 0.55:
                    continue

                print(
                    f"ALERT t={video_timestamp:.1f}s ID={sid} "
                    f"type={behavior_type} conf={result['confidence']:.2f} sev={sev} evidence={path}"
                )

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


    # Clean alert messages for panel
    panel_alerts = {}
    for sid, msg in active_alerts.items():
        panel_alerts[sid] = str(msg)

    annotated_frame = draw_alert_panel(annotated_frame, panel_alerts, panel_width=300)

# FPS on left (not on panel)
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


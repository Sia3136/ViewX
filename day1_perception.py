from ultralytics import YOLO
import cv2
import os
import time
import numpy as np
from collections import defaultdict, deque

# ====================== CONFIG ======================
VIDEO_PATH = "data/videos/Video1.mkv"
OUTPUT_PATH = "outputs/day2_output.mp4"
MODEL_NAME = "yolov8s-pose.pt"
CONFIDENCE = 0.42
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

student_history = defaultdict(lambda: deque(maxlen=HISTORY_LENGTH))
student_turns = defaultdict(int)
last_direction = {}

print("🚀 Day 2 Improved Pipeline Started...")
frame_count = 0
prev_time = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
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

            # 1. Head Direction
            shoulder_center_x = (left_shoulder[0] + right_shoulder[0]) / 2
            head_offset = nose[0] - shoulder_center_x

            if head_offset > 20:
                direction = "Right"
            elif head_offset < -20:
                direction = "Left"
            else:
                direction = "Center"

            # 2. Body Rotation
            shoulder_dx = right_shoulder[0] - left_shoulder[0]
            shoulder_dy = right_shoulder[1] - left_shoulder[1]
            shoulder_angle = np.degrees(np.arctan2(shoulder_dy, shoulder_dx))

            # 3. Hand Movement
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
                "direction": direction,
                "head_offset": head_offset,
                "shoulder_angle": shoulder_angle,
                "left_wrist": left_wrist.copy(),
                "right_wrist": right_wrist.copy(),
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

    # ========== Prepare clean data ==========
    current_students = {}
    for tid, history in student_history.items():
        if len(history) == 0:
            continue
        latest = history[-1]
        current_students[tid] = {
            "id": tid,
            "box": latest["box"],
            "head_direction": latest["direction"],
            "head_turns": student_turns[tid],
            "shoulder_angle": latest.get("shoulder_angle", 0),
            "hand_movement": latest.get("hand_movement", 0),
            "history_length": len(history)
        }

    # Debug print every 15 frames
    if frame_count % 15 == 0:
        print(f"\n--- Frame {frame_count} ---")
        print(f"Active students: {len(student_history)}")
        for sid, data in current_students.items():
            print(f"  ID {sid}: Head={data['head_direction']}, Turns={data['head_turns']}, HandMove={int(data['hand_movement'])}")

    # FPS
    curr_time = time.time()
    fps_text = 1 / (curr_time - prev_time + 1e-6)
    prev_time = curr_time
    cv2.putText(annotated_frame, f"FPS: {int(fps_text)}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    out.write(annotated_frame)
    cv2.imshow("Day 2 - Improved", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
out.release()
cv2.destroyAllWindows()

print("\n✅ Finished!")
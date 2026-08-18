from ultralytics import YOLO
import cv2
import os
import time

# ====================== CONFIG ======================
VIDEO_PATH = "data/videos/Video1.mkv"          # ← Change if needed
OUTPUT_PATH = "outputs/day1_output.mp4"
MODEL_NAME = "yolov8n-pose.pt"
CONFIDENCE = 0.5
# ====================================================

# COCO skeleton connections
SKELETON = [
    [0, 1], [0, 2], [1, 3], [2, 4],             # Head
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],   # Arms
    [5, 11], [6, 12], [11, 12],                # Torso
    [11, 13], [13, 15], [12, 14], [14, 16]     # Legs
]

os.makedirs("outputs", exist_ok=True)

# Load model
model = YOLO(MODEL_NAME)

# Open video
cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    print(f"❌ Cannot open video: {VIDEO_PATH}")
    exit()

width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps    = int(cap.get(cv2.CAP_PROP_FPS)) or 25

fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter(OUTPUT_PATH, fourcc, fps, (width, height))

print("🚀 Day 1 Pipeline Started...")
print(f"Input : {VIDEO_PATH}")
print(f"Output: {OUTPUT_PATH}")

frame_count = 0
prev_time = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1

    # Run detection + tracking + pose
    results = model.track(
        frame,
        conf=CONFIDENCE,
        persist=True,
        tracker="bytetrack.yaml",
        verbose=False
    )

    annotated_frame = frame.copy()

    # -------- Extract data --------
    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.int().cpu().tolist()
        keypoints = results[0].keypoints.xy.cpu().numpy()

        for box, track_id, kpts in zip(boxes, track_ids, keypoints):
            x1, y1, x2, y2 = map(int, box)

            # Draw Bounding Box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # Draw Student ID
            cv2.putText(
                annotated_frame,
                f"ID: {track_id}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2
            )

            # Draw Keypoints (red dots)
            for kx, ky in kpts:
                if kx > 0 and ky > 0:
                    cv2.circle(annotated_frame, (int(kx), int(ky)), 4, (0, 0, 255), -1)

            # Draw Skeleton lines (yellow)
            for i, j in SKELETON:
                if (kpts[i][0] > 0 and kpts[i][1] > 0 and
                    kpts[j][0] > 0 and kpts[j][1] > 0):
                    pt1 = (int(kpts[i][0]), int(kpts[i][1]))
                    pt2 = (int(kpts[j][0]), int(kpts[j][1]))
                    cv2.line(annotated_frame, pt1, pt2, (255, 255, 0), 2)

    # Calculate & show FPS
    curr_time = time.time()
    fps_text = 1 / (curr_time - prev_time + 1e-6)
    prev_time = curr_time
    cv2.putText(annotated_frame, f"FPS: {int(fps_text)}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Write and display
    out.write(annotated_frame)
    cv2.imshow("Day 1 - Detection + Tracking + Pose", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    if frame_count % 30 == 0:
        print(f"Processed {frame_count} frames...")

# Cleanup
cap.release()
out.release()
cv2.destroyAllWindows()

print("\n✅ Finished!")
print(f"Output video saved at: {OUTPUT_PATH}")
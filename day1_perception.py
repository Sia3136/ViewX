from ultralytics import YOLO
import cv2
import time

# ====================== CONFIG ======================
VIDEO_PATH = "data/videos/Video1.mkv"   # ← Change this to your video path
OUTPUT_PATH = "outputs/day1_output.mp4"
MODEL_NAME = "yolov8n-pose.pt"              # nano version (fastest). Use "yolov8s-pose.pt" if you want better accuracy
CONFIDENCE = 0.5
# ====================================================

# Load YOLOv8 Pose model
model = YOLO(MODEL_NAME)

# Open video
cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    print("Error: Could not open video. Check the path.")
    exit()

# Get video properties
width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps_video = cap.get(cv2.CAP_PROP_FPS)

# Create output video writer
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter(OUTPUT_PATH, fourcc, fps_video, (width, height))

prev_time = time.time()

print("Starting processing... Press 'q' to quit early.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run detection + tracking + pose estimation
    results = model.track(
        frame,
        conf=CONFIDENCE,
        persist=True,          # keeps track IDs consistent
        tracker="bytetrack.yaml",
        verbose=False
    )

    # Draw results on frame
    annotated_frame = results[0].plot()   # automatically draws boxes + IDs + skeletons

    # Calculate & show FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time)
    prev_time = curr_time
    cv2.putText(
        annotated_frame,
        f"FPS: {int(fps)}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    # Write frame to output video
    out.write(annotated_frame)

    # Show live preview
    cv2.imshow("Day 1 - Detection + Tracking + Pose", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Cleanup
cap.release()
out.release()
cv2.destroyAllWindows()

print(f"\nDone! Output saved at: {OUTPUT_PATH}")
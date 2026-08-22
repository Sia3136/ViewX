# ML Audit Report

## 1. ML System Summary
The most critical finding of this audit is that **the codebase contains two parallel ML implementations**:
1. **The Intended Architecture:** A set of modular, well-structured files (`src/pose/pose.py`, `src/behaviour/behaviour.py`, `src/detection/object_detector.py`) with sophisticated rule engines, normalization, and temporal logic. **These files are completely disconnected and never executed.**
2. **The Actual Implementation:** A massive monolithic script (`src/pipeline/live_cctv.py`) that runs directly from the Streamlit UI. It implements a highly simplified, hardcoded version of the behavior logic directly inside the video processing loop, bypassing the entire intended architecture to produce a working hackathon demo.

The system relies entirely on pretrained computer vision models for feature extraction (pose/keypoints) and uses hardcoded geometric heuristics to classify behavior. There are no behavior-classification ML models trained on custom datasets.

---

## 2. ML Architecture

**Current (Actual) Architecture in `live_cctv.py`**:
```text
CCTV/Video Input (`cv2.VideoCapture`)
↓
Ultralytics YOLO-Pose Inference (`model.track()`)
↓
Object Association (ByteTrack internal)
↓
Feature Extraction (Extracting 17 keypoints per tracked ID)
↓
Rule-based Heuristics (Math calculations for head offset, hand distance)
↓
Temporal Logic (Checking `student_history` deque for past 60 frames)
↓
Event Generation (Thresholds met)
↓
Postprocessing (Cooldown filter: `current_frame - previous_frame < 45`)
↓
Output (Synchronous JSON write via `EventLogger`)
```

---

## 3. Models

| Model | Purpose | Framework | Version | Input | Output | Pretrained/Custom | Location | Status |
| ----- | ------- | --------- | ------- | ----- | ------ | ----------------- | -------- | ------ |
| **YOLOv8s-pose** | Person Detection & Skeleton Extraction | Ultralytics | 8 | Image/Frame | BBox, Track ID, 17 Keypoints, Conf | Pretrained (COCO) | `live_cctv.py` | **ACTIVE** |
| **YOLOv8s** | Prohibited Item Detection (Phones, Books) | Ultralytics | 8 | Image/Frame | BBox, Class ID, Conf | Pretrained (COCO) | `object_detector.py` | **UNUSED** |
| **ByteTrack** | Multi-Object Tracking | Ultralytics | Native | Detections | Track IDs | Preconfigured | `live_cctv.py` | **ACTIVE** |
| **MediaPipe** | Face Mesh (Lip movement, eye peeking) | MediaPipe | N/A | Image | 468 Landmarks | Pretrained | `pose.py` | **UNUSED** |
| **LLMs (Qwen/Llama)** | Alert Explainability | Unknown | N/A | N/A | N/A | N/A | `context.md` | **MISSING** |

---

## 4. Datasets

| Dataset | Source | Format | Location | Size | Labels | Purpose | Used By |
| ------- | ------ | ------ | -------- | ---- | ------ | ------- | ------- |
| **Sample Video** | Local | `.mp4` | `data/videos/sample.mp4`| Unknown| None | Local Inference | `live_cctv.py` |

**Finding:** There are no training datasets, validation datasets, or annotation files in this repository.

---

## 5. Data Pipeline

There is no data pipeline for training. For inference, the pipeline is extremely primitive:
1. **Raw data:** Read frame via `cv2.VideoCapture`.
2. **Preprocessing:** Passed directly to Ultralytics `model.track()`, which internally handles letterboxing, normalization, and resizing.
3. **Feature extraction:** Post-inference tensor extraction (`boxes.xyxy.cpu().numpy()` and `keypoints.xy.cpu().numpy()`).

---

## 6. Training Pipeline

> **No training pipeline was found.**

The system uses 100% off-the-shelf pretrained models (YOLOv8s-pose). Behavior classification is entirely mathematical/rule-based, not learned.

---

## 7. Inference Pipeline

**Trace for a single input frame (`live_cctv.py`):**
1. **Model Loading:** `model = YOLO("yolov8s-pose.pt")` loaded synchronously into memory.
2. **Input:** `cap.read()` fetches a BGR frame.
3. **Prediction:** `self.model.track(frame, persist=True, conf=0.49, tracker="bytetrack.yaml")`
4. **Keypoint Extraction:** Filters for humans with exactly 17 keypoints.
5. **Math Heuristics:**
   - Calculates `shoulder_center_x = (left_shoulder_x + right_shoulder_x) / 2`
   - Calculates `head_offset = nose_x - shoulder_center_x`
6. **Temporal Updates:** Updates a `student_history` dictionary holding a `deque(maxlen=60)`.
7. **Threshold Checks:** Checks if `head_offset > 20` (Right) or `< -20` (Left).
8. **Cooldown Check:** Verifies the last alert for this student was > 45 frames ago.
9. **Output:** `EventLogger.log_observation()` synchronously writes to `logs/events.json`.

---

## 8. Detection/Classification/Tracking

* **Detection:** YOLOv8s-pose detects persons.
* **Tracking:** ByteTrack assigns persistent IDs. Handled natively by the Ultralytics `.track()` method.
* **Keypoints:** Extracts 17 COCO keypoints (Nose, Shoulders, Wrists, etc.).
* **Object Association:** The unused `object_detector.py` implements a custom IoU and distance-based algorithm (`link_objects_to_students`) to assign prohibited items to the nearest student wrist/box. This is well-written but never called.

---

## 9. Temporal Logic

**Current Active Temporal Logic (`live_cctv.py`):**
* Uses a `deque` of length 60 (approx 2-3 seconds at 25fps) to store previous hand positions.
* Calculates `hand_movement` by taking the `np.linalg.norm` (Euclidean distance) between the current wrist position and the wrist position from the end of the deque.
* Tracks a running integer counter `student_turns[track_id] += 1` if head direction changes from Left/Right.

**Unused Temporal Logic (`behaviour.py`):**
* Sophisticated rolling windows (`HEAD_GLANCE_WINDOW = 10.0` seconds).
* Sustained behavior checks requiring behaviors to persist for `3.0` seconds continuously.

---

## 10. Rule-Based Logic

**There are no ML classifiers for behavior.** 100% of the behavioral decisions are rule-based geometry.

* **Sideward Glance:** `if head_offset > 20: alert()`
* **Repeated Head Turning:** `if student_turns >= 3: alert()`
* **Unusual Hand Movement:** `if hand_movement > 28: alert()`

The intended engine in `behaviour.py` uses shoulder-width normalization to account for depth/camera distance. The active `live_cctv.py` uses raw pixel distances (`head_offset > 20`), which will break completely if a student sits further from the camera.

---

## 11. False Positive Handling

| Filter | Purpose | Threshold | Location | Effect |
| ------ | ------- | --------- | -------- | ------ |
| **Minimum Confidence** | Ignore weak detections | `0.49` | `live_cctv.py` | Reduces ghost detections. |
| **Alert Cooldown** | Prevent log spamming | `45 frames` | `live_cctv.py` | Drops duplicate alerts occurring within ~1.5 seconds. |

*Note: The highly robust false-positive handlers written in `behaviour.py` (e.g., suppressing hand-movement alerts if the person is just "stretching") are bypassed and unused.*

---

## 12. ML → Backend Integration

| ML Component | Backend Consumer | Input | Output | Connection | Status |
| ------------ | ---------------- | ----- | ------ | ---------- | ------ |
| **CV Pipeline** | Streamlit UI | Local MP4 | `logs/events.json` | Disk I/O | 🟡 Synchronous file read |

There is no network boundary. The ML code writes to disk; the UI reads from disk.

---

## 13. Broken/Empty Connections

* **`src/pipeline/video_pipeline.py` is empty.** It contains only `def process_frame(self, frame): return frame` with comments saying "The actual perception modules will be connected by the team later."
* **`src/detection/detector.py` is empty.** Returns `[]` with a TODO.
* **`src/detection/object_detector.py` is disconnected.** The logic to detect phones/books is completely ignored by the active pipeline.
* **`src/pose/pose.py` is disconnected.** MediaPipe lip-reading and EAR/MAR eye-aspect ratio code is dead code.
* **`src/behaviour/behaviour.py` is disconnected.** The entire advanced rule engine is dead code.

---

## 14. Configuration

* **`config.yaml`**: Exists, but is completely ignored by the active pipeline.
* **Hardcoded Values in `live_cctv.py`**:
  * `MODEL_NAME = "yolov8s-pose.pt"`
  * `CONFIDENCE = 0.49`
  * `VIDEO_PATH = "data/videos/sample.mp4"`
  * Pixel threshold `20` for head offset.
  * Pixel threshold `28` for hand movement.

---

## 15. Dependencies

From `requirements.txt`:
* `opencv-python`, `numpy`, `PyYAML`, `pandas` (Standard)
* `streamlit` (UI)
* `ultralytics` (Core ML Framework for YOLOv8)

**Missing Dependencies:**
* `mediapipe` (Imported by intended architecture, but missing from requirements).

---

## 16. Performance

* **CPU/GPU Usage:** Running YOLOv8s-pose and tracking inside a synchronous UI loop is a massive bottleneck. The UI completely freezes while processing frames.
* **Duplicate Math:** Keypoint extractions and Euclidean distances are calculated on every single frame sequentially on a single thread.

---

## 17. Evaluation

> **No evaluation code, metrics, or test sets were found.**

There is no code to measure Accuracy, Precision, Recall, or False Positive Rates. The thresholds (e.g., `> 20` pixels) appear to have been guessed visually during the hackathon.

---

## 18. ML Quality Risks

1. **Depth/Scale Failure (Critical):** The active script uses raw pixel differences (`offset > 20`). A student 5 meters away turning their head 90 degrees might only generate a 10-pixel offset, while a student 1 meter away turning 10 degrees generates a 30-pixel offset. The active code is completely scale-invariant.
2. **False Positives:** The active script lacks contextual awareness. Adjusting glasses or stretching will trigger the `unusual_hand_movement` alert.
3. **Temporal Instability:** ByteTrack handles ID switching well, but if an ID is lost and reassigned, the `student_history` deque is wiped, resetting their historical behavior accumulation.

---

## 19. Current Gaps

### EXISTS AND WORKS
* YOLOv8-pose keypoint extraction.
* ByteTrack multi-person ID tracking.
* Local logging to JSON.

### EXISTS BUT UNUSED
* Advanced `BehaviorEngine` with scale normalization.
* MediaPipe EAR/MAR (Eye/Mouth) detection.
* YOLOv8 Prohibited Item (Phone/Book) detection.
* Proximity-based object-to-student association.

### REQUIRED BUT NOT IMPLEMENTED
* Real-time RTSP/Camera ingestion (currently relies on `cv2.VideoCapture("sample.mp4")`).
* Asynchronous inference pipeline (to free the web backend).

---

## 20. Intended ML System

Based on the disconnected code and `context.md`, the intended system is:
* **Verified:** YOLOv8s-pose extracting keypoints.
* **Verified:** Object detection finding phones/chits and linking them to wrists via proximity.
* **Verified:** Behavior Engine calculating angles normalized by shoulder-width.
* **Inferred:** A background worker running this CV pipeline concurrently with the web server.

---

## 21. Required ML Work

To fix the ML pipeline for production, the following must be done:
1. **Refactor the Pipeline:** Delete the monolithic `live_cctv.py` loop. Wire up the actual `VideoPipeline` to call `pose.py`, `object_detector.py`, and `behaviour.py` sequentially.
2. **Implement Depth Normalization:** Switch entirely to the `behaviour.py` logic which uses `shoulder_width` as a relative pixel-ruler to make thresholds scale-invariant.
3. **Connect Object Detection:** Re-enable YOLOv8s to flag mobile phones and assign them to the nearest student ID.
4. **Decouple from UI:** Wrap the inference loop in an async/background process (e.g., Celery, Redis queue, or FastAPI background tasks).

---

## 22. Implementation Roadmap

1. **ML Architecture Refactor:** Wire the disconnected modules (`pose.py`, `behaviour.py`, `object_detector.py`) into a single cohesive, decoupled pipeline script.
2. **Configuration Binding:** Remove all hardcoded thresholds from the scripts and bind them exclusively to `config.yaml`.
3. **Data Preprocessing:** Implement robust error handling for occluded keypoints (e.g., when legs/wrists are hidden by desks).
4. **Inference Asynchrony:** Move the CV pipeline out of Streamlit into a headless worker process.
5. **Model Evaluation:** Create a small test dataset of annotated cheating/non-cheating clips to scientifically calibrate the thresholds instead of guessing.
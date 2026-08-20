Yes — here’s a **shorter, cleaner README.md version** that still covers what you’ve done, current status, and future implementation without being too huge.

````markdown
# ExamGuard — AI Monitoring System

## AI-Assisted Examination Monitoring using Computer Vision

ExamGuard is an AI-assisted examination monitoring system that uses computer vision to detect potentially unusual student behaviours and generate alerts for human review.

> **Note:** ExamGuard does not automatically decide whether a student is cheating. Alerts are indicators that require human verification.

---

## 🚀 Project Overview

The system follows this pipeline:

```text
CCTV / Video
     ↓
Person Detection
     ↓
Tracking + Pose Estimation
     ↓
Behaviour Analysis
     ↓
Alert Generation
     ↓
Event Logger
     ↓
ExamGuard Dashboard
````

---

## 📌 Current Development Status

```text
Day 1  → Foundation + Privacy + Event Logging       ✅
Day 2  → YOLO + Tracking + Pose Estimation         ✅
Day 3  → Video + Behaviour Detection + Alerts      ✅
Day 4  → Streamlit Monitoring Dashboard             ✅
```

---

## ✅ Implemented Features

### Day 1 — Foundation

* Central `EventLogger`
* JSON and CSV event storage
* Timestamped events
* Anonymous student IDs
* Confidence and behaviour information
* Privacy-aware event design
* Logger and integration testing

Example:

```json
{
  "student_id": "student_004",
  "behaviour_type": "repeated_sideward_glance",
  "confidence": 0.86,
  "explanation": "Student repeatedly turned their head toward the left."
}
```

### Day 2 — Computer Vision

* YOLO pose-based person detection
* Person tracking
* Body keypoint extraction
* Nose, shoulder and wrist tracking
* Student-specific movement history

### Day 3 — Behaviour Analysis

Current detection includes:

* Head direction: Left / Right / Center
* Repeated head turns
* Sideward glances
* Wrist/hand movement
* Rule-based alert generation
* Alert cooldown/active-alert handling

### Day 4 — Dashboard

Streamlit-based **ExamGuard** monitoring interface with:

* Live Feeds
* Active Alerts
* Students
* Analytics
* Event Log
* Settings
* Monitoring controls
* Lightweight CCTV overlays

---

## 🖥️ Dashboard Structure

```text
ExamGuard
│
├── Live Feeds
├── Students
├── Analytics
├── Event Log
└── Settings
```

### Live Feeds

Displays the video stream with computer vision results and monitoring controls.

### Active Alerts

Shows recent behavioural alerts without overwhelming the main dashboard.

### Students

Provides anonymous student-level event information.

### Analytics

Displays event counts, confidence information and behaviour distribution.

### Event Log

Provides the complete historical event record.

### Settings

Provides monitoring and interface configuration options.

---

## 🧠 Technology Stack

```text
Python
OpenCV
Ultralytics YOLO
YOLO Pose
NumPy
Pandas
Streamlit
JSON / CSV
```

---

## 📁 Project Structure

```text
DrishtiAI-project/
│
├── dashboard.py
├── live_cctv.py
├── dayvideo1_perception.py
│
├── detector.py
├── tracker.py
├── pose.py
├── behaviour.py
├── object_detector.py
├── alert.py
├── logger.py
├── privacy.py
│
├── pages/
│   ├── 01_Live_Feeds.py
│   ├── 02_Students.py
│   ├── 03_Analytics.py
│   ├── 04_Event_Log.py
│   └── 05_Settings.py
│
├── data/
│   └── videos/
│       └── sample.mp4
│
├── logs/
│   ├── events.json
│   └── events.csv
│
├── outputs/
├── requirements.txt
└── README.md
```

---

## ▶️ Running the Project

### 1. Create Virtual Environment

```powershell
python -m venv .venv
```

### 2. Activate Environment

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 4. Start Dashboard

```powershell
streamlit run dashboard.py
```

### 5. Run Computer Vision Pipeline

```powershell
python dayvideo1_perception.py
```

---

## 🧪 Testing

Run the logger test:

```powershell
python test_logger.py
```

Run the integration test:

```powershell
python test_integration.py
```

---

## ⚠️ Current Limitations

The current version is a prototype.

* Behaviour detection is mainly rule-based.
* Head direction depends on pose geometry.
* Tracking may be affected by occlusion or crowded scenes.
* Alert thresholds require calibration.
* Current testing primarily uses recorded/sample video.
* Real CCTV/RTSP deployment is not fully implemented yet.
* AI alerts can produce false positives.

---

## 🔮 Future Implementation

### Phase 1 — Real CCTV

Support:

```text
RTSP
IP Cameras
USB Cameras
Recorded CCTV
```

### Phase 2 — Multi-Camera Monitoring

Support multiple examination rooms and camera feeds.

### Phase 3 — Improved Behaviour Recognition

Expand detection to:

* Repeated sideward glances
* Looking behind
* Excessive head movement
* Unusual hand movement
* Posture changes
* Suspicious interactions

### Phase 4 — Temporal Behaviour Model

Analyse sequences of frames instead of isolated frames to reduce false alerts.

```text
Multiple Frames
      ↓
Temporal Model
      ↓
Behaviour Classification
      ↓
Alert
```

### Phase 5 — Better Tracking

Improve:

* Occlusion handling
* Track recovery
* Multi-person tracking
* Identity continuity

### Phase 6 — Alert Prioritisation

Introduce:

```text
LOW
MEDIUM
HIGH
```

based on behaviour frequency, duration and confidence.

### Phase 7 — Analytics

Future analytics may include:

* Alert timelines
* Behaviour frequency
* Camera-wise statistics
* Heatmaps
* Session comparisons

### Phase 8 — Privacy & Production

Future improvements:

* Configurable data retention
* Automatic log deletion
* Stronger anonymisation
* Role-based access
* Encrypted storage
* Production CCTV deployment

---

## 🏗️ Current Architecture

```text
Video Input
    ↓
YOLO Detection
    ↓
Tracking
    ↓
Pose Estimation
    ↓
Behaviour Analysis
    ↓
Alert Engine
    ↓
JSON / CSV Logger
    ↓
Streamlit Dashboard
```

---

## 🎯 Development Goal

The goal is to evolve ExamGuard from a prototype into a reliable, privacy-aware, real-time examination monitoring system that assists invigilators without replacing human judgement.

---

## ⚖️ Disclaimer

ExamGuard is an experimental AI-assisted monitoring system.

Computer vision results can be affected by lighting, camera position, occlusion, image quality and student posture.

**AI-generated alerts must be treated as signals for human review and not as definitive evidence of cheating or academic misconduct.**



# DRISHTI AI — Day 1 (Kavya: Integration + Dashboard)

This is the Day 1 foundation for Problem Statement #1:
AI-Based Human Behaviour Monitoring Using Pose Estimation and Gesture Analysis.

## Day 1 scope
- Clean project structure
- Central configuration
- Basic video input/display pipeline
- Standard event-log schema
- Privacy-conscious storage helpers
- Integration interfaces for detector/tracker/pose/behaviour/object modules
- Dashboard skeleton
- Mock alert generator for testing the dashboard independently

## Important
Day 1 does NOT attempt to decide whether a student is cheating.
Alerts are only observations/events and must be reviewed by an invigilator.

## Setup

```bash
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

Install:
```bash
pip install -r requirements.txt
```

Run the basic video pipeline:
```bash
python main.py --source 0
```

Run with a video:
```bash
python main.py --source data/sample.mp4
```

Run the dashboard:
```bash
streamlit run dashboard.py
```

The dashboard can use the mock event generator until the real perception pipeline is connected.

## Privacy design
The system uses anonymous IDs such as `student_001`.
Do not store names, roll numbers, face embeddings, or face-recognition identities in the Day 1 event log.
The event log stores behavioural metadata, timestamps, confidence, explanations and optional anonymised keypoint snapshots.

## Expected integration payload
The perception teammate can later send:

```python
{
    "student_id": "student_001",
    "bbox": [x1, y1, x2, y2],
    "keypoints": [[x, y, confidence], ...],
    "track_confidence": 0.93
}
```

The dashboard/logger can then consume this without changing the overall project structure.

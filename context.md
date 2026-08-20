# Project Context: AI-Based Human Behaviour Monitoring Using Pose Estimation and Gesture Analysis

## 1. Project Information
- **Event:** Drishti AI Hackathon 2026
- **Team Name:** CaseBlitz (Team ID: DI_111)
- **Problem Statement ID:** 1

## 2. Topic / Domain
**Domain:** AI-powered Video Analytics, Computer Vision, and EdTech (Examination Invigilation).
**Topic:** AI-Based Human Behaviour Monitoring Using Pose Estimation and Gesture Analysis for real-time detection of examination misconduct.

## 3. Problem Statement
Continuous manual observation during physical examinations is difficult, prone to fatigue and bias, and often leads to suspicious behaviors going unnoticed or detected too late. The challenge is to develop an AI-powered video analytics system capable of:
- Monitoring seated students in real time using pose estimation and gesture analysis.
- Identifying suspicious behaviors (repeated sideward glances, excessive head turning, body rotation, unusual hand movements, non-verbal communication).
- Preserving student privacy (avoiding identity-based or facial recognition).
- Operating in real time while tracking multiple students simultaneously.
- Generating explainable alerts that highlight specific behaviors rather than making direct accusations.
- Being robust to seating arrangements, camera angles, lighting conditions, and student demographics with high accuracy and minimal false alarms.

## 4. Proposed Solution
**Automated AI Invigilation System**
- **AI-Powered Physical Hall Invigilator:** A real-time, continuous, 300-degree surveillance system that monitors all students simultaneously using computer vision.
- **Privacy-First Architecture:** Relies on pose estimation rather than facial recognition to ensure data protection.
- **Objective Evidence Collection:** Generates timestamped logs and photographic evidence for every incident to provide tangible proof.
- **Cost-Effective & Scalable:** Eliminates the need for high-end GPUs, designed to run on affordable microcomputers (like the Raspberry Pi 5) to monitor dozens of students using a single camera.

## 5. Our Approach and Key Ideas
- **Novel Dual-Triangle Geometric Approach:** Uses five facial keypoints to construct two geometric triangles (nose-eyes and nose-ears), calculating head rotation angles (left, right, back) via the Law of Cosines for granular accuracy.
- **GPU-Free Real-Time Efficiency:** Achieves 6–10 FPS on CPU-only hardware (Raspberry Pi) and targets 15–20+ FPS on standard machines.
- **Dynamic Thresholding:** Uses individualized thresholds for each student based on specific seating angles to reduce false alarms from natural movements (e.g., stretching).
- **Behavioral Intelligence Engine:** Analyzes temporal behavioral patterns and performs multi-cue fusion before generating alerts.
- **"Black Box" Evidence Pipeline:** Automates end-to-end integration, from detection to automated cloud logging (saving evidence to an Excel file on Google Drive).
- **Explainable AI:** Provides evidence-backed, human-readable alerts rather than raw data points.

## 6. Technology Stack
- **Programming Language:** Python
- **Frontend / UI:** React.js, Tailwind CSS
- **Backend / API:** FastAPI
- **Computer Vision:** OpenCV
- **Detection & Tracking:** YOLOv11 (Ultralytics), ByteTrack (for multi-object tracking and stable IDs)
- **Pose Estimation:** MediaPipe Pose (or YOLOv8-Pose)
- **Custom Engines:** Behavioral Intelligence Engine, Temporal Behavior Analysis
- **Explainable AI Engine:** Qwen2.5-VL, Llama 3.1
- **Database:** PostgreSQL
- **Infrastructure / Tools:** Docker, Git & GitHub

## 7. Methodology / Workflow
The technical pipeline is divided into 7 distinct layers:
1. **Input Layer:** CCTV / IP Camera, USB Webcam, or Recorded Video.
2. **Video Preprocessing:** Frame Extraction, Noise Reduction, Frame Resizing, ROI Selection.
3. **Computer Vision Pipeline:** 
   - YOLOv11 for Student & Object Detection (Mobile Phones, Paper/Chits, etc.).
   - ByteTrack for Multi-Object Tracking.
   - MediaPipe Pose for Skeleton Extraction.
4. **Feature Extraction:** Extracts Head Orientation, Side Glance, Body Lean, Hand Movement, Motion Duration, and Object Interaction.
5. **Behavioral Intelligence Engine:** Temporal Behavior Analysis, Multi-Cue Behavior Fusion, Dynamic Risk Scoring, and Behavior Classification (Normal, Watch, Suspicious, High Risk).
6. **Explainable AI Engine:** Alert Explanation, Behavior Summary, Confidence Score, Evidence Generation.
7. **Monitoring Dashboard:** Live Feed, Student Tracking, Real-Time Alerts, Behavior Timeline, Risk Heatmap, Event Logs (stored in PostgreSQL).

## 8. Proposed Code/Module Structure
As specified in the Day 1 integration plan, the codebase is structured around the following core Python modules:
- `detector.py`: Student and general object detection logic.
- `tracker.py`: Multi-object student tracking logic.
- `pose.py`: Pose estimation and keypoint extraction.
- `behaviour.py`: Rule-based behavior analysis engine.
- `object_detector.py`: Prohibited object (phone, paper/chit) detection logic.
- `alert.py`: Real-time alert generation and format construction.
- `logger.py`: Event logging and database/file persistence.
- `dashboard.py`: Streamlit/Gradio visualization dashboard interface.

## 9. Project Timeline and Milestones
The project is split across a 5-day timeline with specific roles for team members (Perception, Behaviour + Objects, Integration + Dashboard):
- **Day 1: Foundation & Setup:** Environment setup, multi-person detection/tracking, basic pose estimation, defining suspicious behaviors and thresholds, baseline object detection, project structure, config, and privacy plan.
- **Day 2: Core Modules Development:** Improving tracking robustness, extracting temporal features (head/body/hand), implementing rule-based behavior engine, event logging system, dashboard skeleton, and alert formatting.
- **Day 3: Full Integration (Most Important Day):** Connecting detection → tracking → pose → feature extraction into a real-time pipeline, plugging in behavior/object engines, connecting live pipeline to dashboard, generating real-time alerts.
- **Day 4: Robustness, Analytics & Polish:** Testing edge cases (lighting, angles, occlusion), reducing false positives, completing behavioral analytics module, downloadable event logs, UI polish, and strict privacy enforcement.
- **Day 5: Testing, Demo Preparation & Documentation:** Joint testing, recording clean demo videos, FPS optimization, final dashboard polish, writing README, and dry-running the presentation.

## 10. Requirements, Constraints, and Assumptions
- **Real-Time Requirement:** The perception pipeline must run in real-time (target ≥ 15–20 FPS on standard development machines).
- **Hardware Constraint:** The prototype must be optimized for low-power, CPU-only hardware (e.g., Raspberry Pi 5).
- **Privacy Constraint:** Strict privacy enforcement; no face images or facial recognition data can be saved. Store only anonymized Student IDs and pose keypoints.
- **Robustness Requirements:** Must handle occlusion (using multi-object tracking), semantic ambiguity (using dynamic thresholding), varying lighting conditions, and out-of-distribution generalization.
- **Team Roles Assumption:** Work is distributed among three specific tracks: Perception (Core CV), Behaviour + Objects (Logic & Rules), and Integration + Dashboard (UI/UX & Backend).

## 11. Expected Outcome / Deliverables
- A scalable, automated AI-driven examination monitoring system.
- An intuitive invigilator dashboard displaying live video overlays, active real-time explainable alerts, and scrolling event logs.
- Downloadable behavioral analytics and event logs.
- Robust demonstration videos showcasing both normal and suspicious behaviors across various edge cases.
- Comprehensive documentation detailing the "Black Box" pipeline and behavioral detection logic.

## 12. Model Evaluation, Benchmarks, and References

### Computational & Robustness Reference (Slide 5)
- **Model Complexity:** SBAR models range from BlockGCN (1.3M parameters) to MST-GCN (12M). YOLOv8n-pose requires 9.2B FLOPs.
- **Inference Speed:** PEAR achieves 100+ FPS on standard hardware; YOLOv8-based systems report 12.94 ms/frame, dropping to 10 FPS on Nvidia Jetson Nano systems.
- **TinyML & Optimization:** Post-Training Quantization (PTQ) can reduce model size by 4× and CPU latency by up to 4×.
- **Accuracy Metrics:** GCN-Former achieves high top-1 accuracy on NTU RGB+D 60. Other metrics include Mean Average Precision (mAP) and F1-Score.
- **Pose-Specific Metrics:** PCK (Percentage of Correct Keypoints) within error thresholds, OKS (Object Keypoint Similarity) relative to scale, and MPJPE (Mean Per Joint Position Error) measuring 3D joint distance in cm.
- **Edge Case Datasets:** HumanArt dataset acts as a "stress test" for Out-of-Distribution (OOD) robustness across non-photorealistic domains (cartoons, historical artwork).

### Reference SOTA Benchmarks
- **NTU RGB+D 60/120 (Top-1 Accuracy):** GCN-Former, BlockGCN, HD-GCN/CTR-GCN (90.7% – 93.5% accuracy).
- **NW-UCLA (Top-1 Accuracy):** FG-STFormer, CTR-GCN (97.0% accuracy).
- **MSCOCO (mAP):** ViTPose, TransPose, TokenPose (> 80 mAP).
- **MPII & LSP (PCK):** Nie et al. (92.4% PCKh@0.5), Peng et al. (94.5% PCK@0.2).

### Research Literature References (Slide 6)
- **ByteTrack:** Multi-Object Tracking by Associating Every Detection Box (ECCV 2022) — 80.3 MOTA, 77.3 IDF1, 63.1 HOTA on MOT17/20.
- **Multiple Instance Learning for Cheating Detection (2024):** Combines body posture, eye gaze, head pose, facial features, and spatio-temporal graph learning (87.58% Frame-level AUC on OEP).
- **Real-Time AI-Driven Exam Cheating Detection (2025):** Integrating YOLO and Pose Estimation (92% Precision, 88% Recall, 90% F1-Score).
- **Cheating Recognition Based on Improved YOLOv8 (2025):** Enhanced YOLOv8 with hierarchical detection.
- **Two-Stage, Object-Centric Deep Learning Framework (2026):** Student detection followed by behavior classification using RexNet-150 (95% Accuracy, 96% Precision, 94% Recall).

## 13. Risk Factors and Challenges
The following table outlines the key risk factors, descriptions, and potential impacts as specified in the project documentation:

| Risk Factor | Description | Potential Impact |
| :--- | :--- | :--- |
| **False Positives** | Normal student actions (thinking, stretching, looking around) may be incorrectly flagged. | Reduced trust in the system and unnecessary invigilator intervention. |
| **False Negatives** | Actual suspicious behavior may not be detected. | Potential examination malpractice goes unnoticed. |
| **Occlusion** | Students blocking each other from the camera view. | Incomplete pose estimation and tracking errors. |
| **Poor Lighting Conditions** | Low light, shadows, or glare affecting video quality. | Reduced detection accuracy. |
| **Camera Spots Blind Areas** | Areas not covered by surveillance cameras. | Students in blind spots cannot be effectively monitored. |
| **Head Pose Estimation Errors** | Difficulty accurately detecting viewing direction from distant cameras. | Incorrect monitored behaviour classification. |
| **Multi-Person Tracking Failure** | Identity switching or loss of student tracking across frames. | Incorrect attribution of suspicious activities. |
| **Network Failure** | Loss of connectivity between cameras and processing servers. | Interrupted monitoring and missed events. |
| **Hardware Failure** | Camera, GPU, storage, or server malfunction during examinations. | System downtime and loss of monitoring capability. |
| **Privacy Concerns** | Student concerns regarding surveillance and data collection. | Regulatory, ethical, and acceptance challenges. |

## 14. Points of Ambiguity and Discrepancies
The following inconsistencies and ambiguities exist between the source documents and require clarification before final implementation:

1. **YOLO Version Conflict:**
   - *Presentation (Slide 2):* Mentions YOLOv8 & ByteTrack.
   - *Presentation (Slide 3 - Flowchart & Stack):* Specifies YOLOv11 (Ultralytics).
   - *Presentation (Slide 5):* Mentions YOLOv8-pose.
   - *Timeline (Day 1):* Mentions YOLOv8 for student detection and YOLOv8-Pose or MediaPipe Pose.
   - *Ambiguity:* Clarification is needed on whether YOLOv8 or YOLOv11 should be used for object and pose detection.

2. **Privacy vs. Photographic Evidence:**
   - *Presentation (Slide 2):* States the system "automatically saves timestamps and photographic evidence to an Excel file on Google Drive."
   - *Timeline (Day 1 & Day 4):* Mentions "store only anonymised Student IDs + keypoints (no face images)" and "ensure no face data is saved".
   - *Ambiguity:* If face images/data are strictly prohibited from being saved for privacy, it is unclear how "photographic evidence" can be retained without violating this requirement (e.g., whether to blur/mask faces or only capture specific coordinates/objects).

3. **Storage Mechanism & Destination:**
   - *Presentation (Slide 3):* Lists "PostgreSQL (Alerts & Logs Storage)" in the Technical Stack, while Slide 2 specifies saving evidence to "an Excel file on Google Drive."
   - *Timeline (Day 2 & Day 4):* Specifies saving logs locally to JSON/CSV files.
   - *Ambiguity:* Clarification is needed on the primary storage medium (PostgreSQL database vs. Google Drive Excel vs. local JSON/CSV files) and how they integrate.

4. **Pose Estimation Framework:**
   - *Presentation (Slide 3):* Lists MediaPipe Pose in the Technical Stack.
   - *Timeline (Day 1):* Mentions "MediaPipe or RTMPose" and "YOLOv8-Pose or MediaPipe Pose".
   - *Ambiguity:* Clarification is needed on which framework is preferred for skeletal landmark extraction.

5. **Explainable AI LLM Integration:**
   - *Presentation (Slide 3):* Includes "Qwen2.5-VL" and "Llama 3.1" as the Explainable AI Engine.
   - *Timeline (Days 1-5):* Does not mention these LLMs in any daily task, only referencing custom rule-based engine and templates.
   - *Ambiguity:* It is unclear if LLMs are to be integrated into the active dashboard pipeline or if rule-based text templates are sufficient for the prototype.

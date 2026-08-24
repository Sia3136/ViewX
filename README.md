# Drishti AI (ExamGuard) — AI Examination Monitoring System

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green)
![Next.js](https://img.shields.io/badge/Next.js-16.3-black)
![YOLOv8](https://img.shields.io/badge/YOLO-v8-yellow)

Drishti AI (ExamGuard) is an advanced, AI-assisted examination monitoring system designed to detect potentially suspicious student behaviors during exams. By leveraging computer vision and explainable heuristics, it assists human invigilators with real-time alerts without making autonomous punitive decisions.

---

## 📖 Table of Contents
1. [Problem Statement](#-problem-statement)
2. [Unique Selling Proposition (USP)](#-unique-selling-proposition-usp)
3. [Use Case](#-use-case)
4. [System Architecture](#-system-architecture)
5. [Machine Learning Architecture](#-machine-learning-architecture)
6. [Tech Stack](#-tech-stack)
7. [Edge Cases Handled](#-edge-cases-handled)
8. [Limitations & Future Scope](#-limitations--future-scope)
9. [Local Setup & Deployment](#-local-setup--deployment)
10. [Acknowledgments](#-acknowledgments)

---

## 🎯 Problem Statement
Manual invigilation in large examination halls is prone to human error, fatigue, and blind spots. **The goal is to automate the detection of suspicious activities and malpractices during examinations using computer vision**, assisting human invigilators with real-time, explainable alerts.

---

## 🚀 Unique Selling Proposition (USP)
- **Explainable AI (XAI):** The system does not merely flag a student as "cheating". It provides concrete behavioral reasons (e.g., *"Sustained Gaze"*, *"Prohibited Object Detection"*, *"Repeated Sideward Glances"*).
- **Privacy-Preserving Edge Processing:** Video feeds are processed locally on the edge via the ML Worker. No sensitive video streams are transmitted to the cloud, ensuring strict data privacy.
- **Dynamic Thresholding:** Employs personalized statistical baselines for head movements, differentiating between natural body sway and suspicious behavior.
- **Decoupled Architecture:** The ML worker operates natively to maximize GPU efficiency, while the web stack (Next.js + FastAPI) is fully Dockerized for scalability and easy deployment.

---

## 💼 Use Case
- **Universities & Schools:** Large-scale exam monitoring across multiple halls.
- **Certification Centers:** High-stakes professional examinations requiring strict compliance.
- **Remote Proctoring Hubs:** Centralized monitoring where invigilators oversee multiple camera feeds via a single real-time dashboard.

---

## 🏗️ System Architecture

The system uses a decoupled, hybrid architecture. The web application is Dockerized for reproducible deployments, while the computer vision ML worker runs natively to interface directly with local cameras and GPUs.

```mermaid
flowchart TD
    Browser[Web Dashboard\n(Invigilator UI)]
    
    subgraph Docker Compose Stack
      Frontend[Frontend\nNext.js]
      Backend[Backend\nFastAPI & WebSockets]
      DB[(PostgreSQL)]
      Redis[(Redis Pub/Sub)]
    end
    
    MLWorker[Native ML Worker\nYOLOv8 & OpenCV]
    Cameras[IP/CCTV Cameras]
    
    Cameras -->|RTSP/Video Feed| MLWorker
    MLWorker -->|Writes Events| DB
    MLWorker -->|Publishes Alerts| Redis
    Redis -->|Streams Data| Backend
    Backend -->|WebSockets| Browser
    Browser -->|HTTP| Frontend
    Frontend -->|API Requests| Backend
```

---

## 🧠 Machine Learning Architecture

The ML pipeline is designed for high accuracy and low latency using a frame-by-frame spatial-temporal analysis engine.

### 1. Detection & Tracking
- **Pose Estimation:** Utilizes **YOLOv8-Pose** to extract 17 key human skeletal keypoints (nose, eyes, ears, shoulders, wrists, etc.).
- **Object Detection:** Secondary detection layer for identifying prohibited items (mobile phones, smartwatches, notes).
- **Tracking:** Implements **ByteTrack** for robust multi-person tracking across frames, even with partial occlusions.

### 2. Behavioral Heuristics Engine
- **Dual-Triangle Head Pose Estimation:** Inspired by recent research (Haider et al. 2025), the system calculates geometric angles using two triangles: (Nose-Left Eye-Right Eye) and (Nose-Left Ear-Right Ear). 
- **Dynamic Turn Scoring:** Generates a continuous `turn_score` to estimate Left/Right/Center direction independently of the camera angle.
- **Temporal Memory:** Maintains a rolling window (e.g., 60 frames) of skeletal features (shoulder angles, wrist movements) to detect sustained actions like *leaning* or *non-verbal communication*.

### 3. Dynamic Baselines
Rather than using static thresholds for head turns (which cause false positives for naturally fidgety students), the system calculates a rolling **median** and **standard deviation** for each specific student. Alerts are only triggered when movements exceed this personalized dynamic threshold (`DYNAMIC_BASE` + `DYNAMIC_STD_MULT * std`).

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16.3, React 19, TypeScript, Tailwind CSS v4, Shadcn UI, Recharts |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy, Alembic |
| **Database & Cache**| PostgreSQL 15, Redis 7 |
| **Machine Learning**| PyTorch, Ultralytics YOLOv8, OpenCV, NumPy |
| **Infrastructure** | Docker, Docker Compose |

---

## 🛡️ Edge Cases Handled

1. **Invigilator Presence:** If a student is staring directly at a walking invigilator, it could be falsely flagged as "Sustained Gaze". The ML pipeline actively detects standing invigilators (using bounding box height ratios and sticky position memory) and **suppresses alerts** when students look in their direction.
2. **Natural Body Sway:** Handled via the dynamic statistical thresholding per track ID.
3. **Bounding Box Overlaps:** In crowded rooms, bounding boxes often overlap. A custom Intersection over Union (IoU) filtering mechanism removes duplicate tracks for the same person.
4. **Lighting Variations:** Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) dynamically to frames before inference to handle dim or washed-out examination halls.

---

## ⚠️ Limitations & Future Scope

- **High-Density Seating:** In extremely crowded setups where lower bodies are heavily obscured, YOLOv8-pose may struggle with keypoint accuracy.
- **Compute Requirements:** Running high-resolution video streams at 30+ FPS requires a dedicated NVIDIA GPU. It is not currently optimized for edge devices like Raspberry Pi.
- **Websocket Security:** Currently, the local MJPEG video transport and WebSocket alert streams are unencrypted. Production deployment will require WSS and HTTPS reverse proxies.
- **Future Scope:** Implement facial recognition for student identity verification (Re-ID across multiple cameras) and federated learning to continuously improve the heuristics engine across different campuses.

---

## ⚙️ Local Setup & Deployment

1. **Environment Variables:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   cp ml_worker/.env.example ml_worker/.env
   ```

2. **Start Web Infrastructure (Docker):**
   ```bash
   docker compose up --build -d
   docker compose exec backend alembic upgrade head
   ```

3. **Start Native ML Worker:**
   ```bash
   python ml_worker/worker.py
   ```

4. **Access Dashboard:**
   Open `http://localhost:3000` in your browser. *(Temporary Dev Bypass: Username: `admin`, Password: `1234`)*

---

## 🏆 Acknowledgments

**Built for the Drishti AI Hackathon.**  
This project was conceptualized, designed, and engineered as part of the Drishti AI hackathon to push the boundaries of ethical, explainable AI in the education sector. 

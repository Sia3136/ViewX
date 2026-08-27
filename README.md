# ViewX 👁️
### *Real-Time AI-Powered Surveillance & Examination Proctoring System*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15%2B-black.svg)](https://nextjs.org/)
[![YOLOv8s](https://img.shields.io/badge/YOLO-v8s-yellow.svg)](https://github.com/ultralytics/ultralytics)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

ViewX is an AI-powered real-time surveillance system that makes CCTV smarter by analyzing live camera feeds and detecting unusual or potentially cheating events. It generates instant alerts and displays incidents through an interactive dashboard for faster response. Our goal is to transform traditional CCTV from a passive recording system into an intelligent, proactive safety solution.

---

## 📖 Navigation
* [Why Build?](#💡-why-build)
* [Key Features & Edge Cases](#🎯-key-features--edge-cases)
* [Product Flows](#🔄-product-flows)
* [System Architecture](#🏗️-system-architecture)
* [User Flow](#👤-user-flow)
* [Backend Architecture](#🔌-backend-architecture)
* [Machine Learning Pipeline](#🧠-machine-learning-pipeline)
* [Tech Stack](#💻-tech-stack)
* [Security & Compliance](#🛡️-security--compliance)
* [Project Structure](#📁-project-structure)
* [API Reference](#🔌-api-reference)
* [Local Setup](#⚙️-local-setup)
* [Environment Variables](#🔐-environment-variables)
* [Docker Deployment](#🐳-docker-deployment)
* [Testing Suite](#🧪-testing-suite)
* [Known Limitations](#⚠️-known-limitations)
* [Roadmap](#🚀-roadmap)
* [Hackathon & Sponsorships](#🏆-hackathon--sponsorships)

---

## 💡 Why Build?
Traditional CCTV networks are purely reactive: they record thousands of hours of video that is only reviewed *after* an incident, security breach, or academic integrity violation has already occurred. Furthermore, manual invigilation in high-stakes environments like exam halls is prone to human error, cognitive fatigue, and spatial blind spots. 

**ViewX** bridges this gap by turning passive video streams into active, real-time safety networks. By applying edge-based computer vision and intelligent behavioral heuristics, ViewX automatically identifies anomalies, alerts operators, and provides clear, explainable proof of incidents in real-time, drastically reducing reaction times and human workload.

---

## 🎯 Key Features & Edge Cases

* **Real-time Event Alerts:** Immediate WebSocket-powered popups with cropped evidence snapshots.
* **Continuous Multi-Student Tracking:** Relies on **ByteTrack** to maintain student identity persistence even across temporal overlaps or partial occlusions.
* **Novel Dual-Triangle Architecture:** Accurately catches the direction of sight to understand copying cases, without needing expensive specialized hardware (like eye-trackers).
* **AI Explainability:** Integrated **Groq API** to provide human-readable, intelligent explanations for detected anomalies.
* **Robust Edge-Case Handling:**
  * **Invigilator in the room:** Walking or standing invigilators naturally draw student gazes. ViewX automatically identifies invigilator coordinates (using height ratio and movement vectors) and suppresses false student gaze alerts within those spatial sectors.
  * **Invigilator helping student to copy:** Detects suspicious invigilator behavior, such as prolonged proximity or helping behavior at a specific student's desk.
  * **Multi-camera in the room:** Concurrently processes multiple camera streams (MJPEG/RTSP) within the same room for a 360° view.
  * **Non-verbal communication:** Captures quick side-ward glances, sign-based gestures, or repeated nodding patterns.
  * **CCTV malfunction:** Monitors stream health and alerts operators immediately if a camera feed is lost or blacked out.
  * **Phone and chit (object) detection:** Specifically detects unauthorized items (mobile phones, smartwatches, chits/notes) on desks or in hands.
  * **Noise in camera quality:** Employs dynamic CLAHE (Contrast Limited Adaptive Histogram Equalization) preprocessing to ensure accuracy in dim lighting, glare, or low-resolution camera outputs.

---

## 🔄 Product Flows

```mermaid
sequenceDiagram
    autonumber
    participant Cameras as CCTV Streams (RTSP/MJPEG)
    participant Worker as Native ML Worker
    participant Broker as Redis (Pub/Sub)
    participant API as FastAPI Backend
    participant DB as PostgreSQL (Data)
    participant UI as Next.js Dashboard
    participant LLM as Groq API (Explainability)

    Cameras->>Worker: Stream raw video frames
    Note over Worker: CLAHE Preprocessing & Frame Alignment
    Worker->>Worker: Run YOLOv8s Pose & Object Inference
    Worker->>Worker: ByteTrack temporal association
    Worker->>Worker: Evaluate Sight Heuristics (Dual-Triangle)
    alt Anomalous Behavior Detected
        Worker->>DB: Save incident logs & Crop Snapshot
        Worker->>Broker: Publish event payload (Redis Pub/Sub)
        Broker->>API: Distribute event to active backend threads
        API->>LLM: Fetch explainability insights
        API->>UI: Broadcast real-time alert via WebSockets
        UI->>UI: Play alarm & Display visual alert drawer
    end
```

---

## 🏗️ System Architecture

ViewX is structured around a highly decoupled, event-driven architecture designed to minimize latency and ensure fault-tolerant edge operations.

```mermaid
flowchart TD
    subgraph Capture & Edge Processing
        C1["CCTV IP Camera (Stream 1)"]
        C2["CCTV IP Camera (Stream 2)"]
        ML["ML Worker (YOLOv8s + Heuristics)"]
    end

    subgraph Messaging & DB
        Redis[("Redis Message Broker")]
        DB[("PostgreSQL Database")]
    end

    subgraph Service Layer
        API["FastAPI Backend Services"]
        LLM["Groq API (Explainability)"]
    end

    subgraph Presentation Layer
        Dashboard["Next.js Operations UI (WebSocket Connected)"]
    end

    C1 & C2 -->|MJPEG/RTSP Streams| ML
    ML -->|Publish Real-time Alerts| Redis
    ML -->|Persist Logs & Snapshots| DB
    Redis -->|Consume Event Stream| API
    API -->|LLM Prompt| LLM
    API -->|REST API / DB Queries| DB
    API -->|WebSocket Server| Dashboard
    Dashboard -->|Control Commands| API
```

### 🔺 Novel Dual-Triangle Sight Tracker
To accurately determine cheating or copying behaviors, ViewX introduces a **Novel Dual-Triangle Architecture** for head and sight vector tracking:
1. **The Eye-Nose Triangle:** Formed by the spatial coordinates of the Nose, Left Eye, and Right Eye.
2. **The Ear-Nose Triangle:** Formed by the spatial coordinates of the Nose, Left Ear, and Right Ear.

By computing the geometric offsets, aspect ratio, and angular vectors between these two triangles, the heuristics engine establishes a continuous `gaze_direction` score. This mathematical model is scale-invariant and robust against variable camera mounting heights, enabling precise identification of sideward glances, desk-gazing, and unauthorized sheet viewing.

---

## 👤 User Flow

1. **Dashboard Overview:** Upon logging in, operators see a layout of all active camera channels, live alerts, and a summary dashboard.

   *Live Camera with Alerts:*
   ![Camera with alerts](Black%20Blue%20and%20White%20Modern%20Startup%20Pitch%20Deck%20Presentation%20%281%29.png)

2. **Real-Time Notification:** If a student exhibits prolonged sideward gazing or holds a phone, a red alert drawer slides out, highlighting the camera feed, location, student tag, and confidence score.

   *Live Alerts Dashboard:*
   ![Live alerts dashboard](Black%20Blue%20and%20White%20Modern%20Startup%20Pitch%20Deck%20Presentation%20%282%29.png)

3. **Audit Trails (Student Drawer):** Clicking an alert opens the student's history profile. Invigilators can check historical timestamps and look at the "Evidence Snapshot" saved in the database, complete with AI explainability.

   *Alert Complete Info:*
   ![Complete info of a particular alert](Black%20Blue%20and%20White%20Modern%20Startup%20Pitch%20Deck%20Presentation.png)

4. **Configuration Settings:** Invigilators can tune the threshold values (e.g., alert duration, minimum confidence percentage) dynamically to match the exam strictness level.

---

## 🔌 Backend Architecture
The backend is powered by **FastAPI**, written in asynchronous Python 3.10+.
* **WebSocket Server:** Maintains low-overhead stateful connections to multiple frontend clients.
* **SQLAlchemy & Alembic:** Standard SQL ORM for postgres schema integrity.
* **Redis Pub/Sub:** Decoupled architecture allowing multiple ML workers to push alert events safely without choking API threads.

---

## 🧠 Machine Learning Pipeline

### 🤖 Why YOLOv8s and NOT YOLOv11?
We chose **YOLOv8s (Small)** over the newer YOLOv11 version based on critical edge-deployment parameters:
* **Older & Reliable:** YOLOv8s is a highly matured, stable release with extensive production testing compared to newer variants.
* **Scalability:** It runs efficiently on mid-range edge accelerators, ensuring high frame-rates without requiring expensive high-end GPUs.
* **Less Costly:** The compute cost-to-accuracy ratio is highly optimized, allowing institutional users to deploy the surveillance stack on standard hardware.
* **Strategic Tradeoff:** The minor precision improvement in YOLOv11 did not justify its increased hardware footprint and deployment costs, especially when scaling across multiple concurrent camera feeds on the edge.

### ⏱️ Latency & Performance
* **Total Latency per Frame:** **~30ms**
* This latency is end-to-end and covers:
  1. *Video Preprocessing & Clahe filters*
  2. *YOLOv8s Pose & Object Inference*
  3. *ByteTrack Association*
  4. *Dual-Triangle Sight direction computation*
  5. *Redis propagation & database logging*
* With a latency of ~30ms, the system easily achieves a fluid **30+ FPS**, ensuring true real-time threat detection.

---

## 💻 Tech Stack

* **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI, Recharts
* **Backend:** FastAPI, Python 3.10+, SQLAlchemy, Alembic, Uvicorn
* **Databases:** PostgreSQL (Relational logs & metrics), Redis (Pub/Sub message queues)
* **Machine Learning:** PyTorch, Ultralytics YOLOv8s, OpenCV, ByteTrack
* **AI API:** Groq API (Explainability)
* **DevOps:** Docker, Docker Compose

---

## 🛡️ Security & Compliance
* **Local Edge Processing:** Raw video data is processed in memory and never uploaded to cloud providers, keeping the installation GDPR and HIPAA compliant.
* **Data Minimization:** Full-room video recordings are not stored. The system only retains small cropped image snapshots of the specific area/student when an alert is logged.
* **Admin Access Security:** Protected API routes using JSON Web Tokens (JWT).

---

## 📁 Project Structure

```text
DI1_11_CaseBlitz/
├── backend/              # FastAPI Application
│   ├── src/
│   │   ├── api/          # Route Handlers (events, analytics, ws)
│   │   ├── core/         # DB Connection & Video Stream Managers
│   │   ├── models.py     # SQLAlchemy DB schemas
│   │   └── pipeline/     # Perception, tracking, & heuristics scripts
│   ├── Dockerfile
│   └── main.py
├── frontend/             # Next.js Dashboard Client
│   ├── src/
│   │   ├── app/          # Next.js App Router Pages
│   │   ├── components/   # UI elements (student tables, drawer, dashboard grid)
│   │   └── context/      # WebSocket & global state context
│   └── Dockerfile
├── ml_worker/            # Edge Inference Engine
│   ├── core/             # Pose heuristics & frame trackers
│   └── worker.py         # Native python worker script
├── docker-compose.yml    # Combined local orchestration stack
└── README.md             # Project documentation
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticate administrator, returns JWT token. |
| `/api/events` | `GET` | Fetch paginated behavioral alert logs. |
| `/api/analytics/summary`| `GET` | Key metrics including total alerts, active cameras, and CPU load. |
| `/api/students` | `GET` | Fetch list of active/tracked students and warning statuses. |
| `/api/monitoring/status`| `GET` | Health stats of active video sources. |
| `/api/ws/alerts` | `WS` | Real-time WebSocket connection to receive live alerts. |
| `/api/health` | `GET` | Server liveness probe. |

---

## ⚙️ Local Setup

### Prerequisites
* Python 3.10+
* Docker Desktop & Docker Compose
* NVIDIA Drivers & CUDA Toolkit (if running GPU accelerated inference)

### 1. Environment Configuration
Clone the repository and clone the environment variable templates:
```bash
git clone https://github.com/DrishtiAI-DJSCE/DI1_11_CaseBlitz.git
cd DI1_11_CaseBlitz

# Create environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp ml_worker/.env.example ml_worker/.env
```

### 2. Configure Database & Services
Run the postgres DB, Redis, and Web servers:
```bash
docker compose up --build -d
```

### 3. Run Database Migrations
Run Alembic migrations to construct database tables:
```bash
docker compose exec backend alembic upgrade head
```

### 4. Run native ML Inference Worker
For performance reasons (such as direct CUDA accessibility and low overhead), the ML worker runs natively on the host:
```bash
# Setup virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install ML requirements
pip install -r backend/requirements.txt

# Start ML worker
python ml_worker/worker.py
```

### 5. Access the Web Application
Open your browser and navigate to: `http://localhost:3000`
*(Use credentials: Admin: `admin` / Password: `1234` in local development mode).*

---

## 🔐 Environment Variables

### Backend `.env`
* `DATABASE_URL`: Connection string (e.g., `postgresql://user:pass@db:5432/examguard` for Docker, or `@localhost:5432/` for native runs).
* `REDIS_URL`: Redis connection URL (`redis://redis:6379`).
* `JWT_SECRET`: Signing token.
* `GROQ_API_KEY`: API Key for AI Explainability.

### ML Worker `.env`
* `DATABASE_URL`: Database connection string (`postgresql://user:pass@localhost:5432/examguard`).
* `REDIS_URL`: Connection URL (`redis://localhost:6379`).

### Frontend `.env.local`
* `NEXT_PUBLIC_API_URL`: Backend endpoint (`http://localhost:8000`).
* `NEXT_PUBLIC_WS_URL`: WebSocket endpoint (`ws://localhost:8000`).

---

## 🐳 Docker Deployment
We provide a unified `docker-compose.yml` to launch Postgres, Redis, the FastAPI Backend, and the Next.js Frontend.
To spin it down or restart cleanly:
```bash
# Stop containers
docker compose down

# Force rebuild & launch
docker compose up --build -d
```

---

## 🧪 Testing Suite
We use **pytest** to verify both unit operations and pipeline integrations.

### Running Unit Tests
Verifies loggers, schema schemas, and utility methods:
```bash
pytest tests/unit
```

### Running Pipeline & Integration Tests
Validates alert handlers, integration engines, and simulation pipelines:
```bash
# Set PYTHONPATH to root directory
$env:PYTHONPATH="." # On Windows PowerShell
pytest tests/integration
```

### Running False Positive Tests
To evaluate pipeline resilience against non-cheating movements (anxious student swaying, invigilator passing by):
```bash
pytest tests/integration/test_day4_false_positives.py
```

---

## ⚠️ Known Limitations

* **High-Density Crowd Occlusion:** In highly congested desks, lower body joints and wrist-keypoints might be occluded, causing temporal tracking drops.
* **Cross-Camera Re-ID:** Student tracking is bound to single-camera outputs. Tracking a student across multiple non-overlapping feeds concurrently is currently experimental.
* **SSL/TLS local transport:** The default Docker Compose setup utilizes unencrypted HTTP/WS. Production systems should deploy behind an Nginx reverse-proxy terminating SSL/TLS.

---

## 🚀 Roadmap

* [ ] **Cross-Camera Identity Handoff (Re-ID):** Consistent student profiling as they walk across camera zones.
* [ ] **Reinforcement Learning:** Implement RL techniques to reduce alert fatigue by learning from invigilator feedback.
* [ ] **YOLOv8x / YOLOv11 Optional Toggle:** Dynamically choose heavy models if hardware capacity allows.
* [ ] **Automated Desk Calibration:** Semi-supervised detection of desk coordinates to speed up system installation.
* [ ] **Custom Audio Anomalies Detection:** Integrating acoustic sensors to flag talking or object dropping sounds.

---

## 🏆 Hackathon & Sponsorships

We built this for the **Drishti AI Hackathon**, Sponsored by **DEX - IT Global** where we were in the **top 6** for the domain. We are proud to share that our solution demonstrated outstanding scalability, reliable latency, and advanced explainable edge AI architectures.

---
*Created with ❤️ by the Drishti AI CaseBlitz Team.*

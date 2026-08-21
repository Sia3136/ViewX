# ExamGuard — AI Monitoring System

## AI-Assisted Examination Monitoring using Computer Vision

ExamGuard (DrishtiAI) is an AI-assisted examination monitoring system that uses computer vision to detect potentially suspicious student behaviours and generate explainable alerts for human invigilator review.

> **Note:** ExamGuard does not automatically decide whether a student is cheating. Alerts are indicators that require human verification.

---

## 🚀 Project Overview

The project has transitioned from a monolithic prototype to a modern decoupled architecture. The core machine learning engine runs as a headless background worker, writing detections directly to a PostgreSQL database and broadcasting real-time events through Redis PubSub to a secure FastAPI REST and WebSocket API. Clients interact with the system via a modern Next.js single-page application.

```mermaid
flowchart TD
    VideoInput[CCTV / Video Input] -->|Frame Capture| MLWorker[ML Background Worker]
    MLWorker -->|YOLO Pose & Tracking| BehaviourEngine[Behavior Engine]
    BehaviourEngine -->|SQLAlchemy| DB[(PostgreSQL Database)]
    BehaviourEngine -->|Publish 'alerts'| Redis[(Redis PubSub)]
    
    FastAPI[FastAPI API Server] -->|SQLAlchemy| DB
    Redis -->|Subscribe 'alerts'| FastAPI
    
    FastAPI -->|WebSockets| NextJS[Next.js Frontend Clients]
    FastAPI -->|HTTP REST| NextJS
```

---

## 📌 Current Development Status

The codebase consists of the following components:
- **`ml_worker/`**: Headless Python background daemon running YOLOv8 tracking + custom pose-based spatial heuristics.
- **`backend/`**: FastAPI REST API + WebSocket broadcaster + JWT Authentication.
- **`frontend/`**: Modern Next.js (App Router, Tailwind CSS v4, Shadcn UI) web application dashboard.
- **`src/dashboard/`**: Streamlit dashboard prototype (legacy monolithic visualizer).

---

## ✅ What's Working (Implemented Features)

### 1. Headless Background ML Worker
* Decoupled tracking and behavioral calculations from UI loops.
* Runs YOLOv8 multi-object tracking (ByteTrack) and Pose Estimation.
* Custom normalization heuristics using the `BehaviorEngine` (adjusts thresholds based on student distance/shoulder width).
* Tracks:
  * Sideward glances.
  * Repeated head turns.
  * Body rotations.
  * Unusual hand/wrist movements.
  * Non-verbal communication/gestures.
* Writes events directly to PostgreSQL.
* Publishes real-time events to Redis channel `alerts`.

### 2. FastAPI REST & WebSocket Server
* **Authentication**: JWT login service (`/api/auth/login`) with role authorization (Admin vs. Invigilator) using bcrypt hashed passwords.
* **Event History**: Paginated (`skip`/`limit`) and filterable (`student_id`, `behaviour_type`) GET API endpoint.
* **Analytics**: Aggregated summary API (`/api/analytics/summary`) returning grouped alert counts by behavior type.
* **Dynamic Settings**: Routes to query and patch thresholds in the DB (`GET /api/settings`, `PATCH /api/settings`).
* **Real-time Broadcaster**: WebSocket connection (`WS /api/ws/alerts`) subscribing to Redis and broadcasting instantly to clients.

### 3. Next.js Web Client Scaffold
* **Application Shell**: Fully responsive sidebar navigation and user account status bar.
* **Axios API Client**: Handles session configuration, header injection (`Bearer <token>`), and global 401 response interceptors.
* **Global Auth Provider**: Custom React Context managing session states, local storage token caching, and user routing security.
* **Real-Time Live Feed Alerts**: Active alerts page streaming raw events instantly via WebSocket without polling.
* **Scalable Data Views**: Paginated Historical Event Log table and Client-Side Aggregated metrics views.
* **Settings Portal**: Dynamic CRUD form interacting directly with backend dynamic settings, while gracefully denoting legacy settings gaps.
* **Failure Tolerance**: Robust loading states (skeletons), error boundaries (connection fallback details), and empty states across all pages.

### 4. Tests
* Comprehensive automated integration and unit tests validating behavioral heuristics, pipeline logic, and database integrations.

---

## 🧠 Technology Stack

### ML / Processing
* **Language:** Python (3.10 - 3.14)
* **Computer Vision:** OpenCV, Ultralytics YOLOv8 / YOLO Pose
* **Math & Processing:** NumPy, Pandas, PyYAML
* **Models:** `yolov8s-pose.pt`

### Backend
* **Framework:** FastAPI
* **Runtime:** Python / Uvicorn
* **Database ORM:** SQLAlchemy
* **Migrations:** Alembic
* **Authentication:** PyJWT, passlib[bcrypt]

### Database & Message Broker
* **Database:** PostgreSQL (15+)
* **PubSub:** Redis (7+)

### Frontend (Dashboard)
* **Framework:** Next.js (16+ App Router, React 19)
* **Styling:** Tailwind CSS (v4)
* **Component Library:** Shadcn UI (Zinc theme)
* **Icons:** Lucide React
* **State & Networking:** React Context + Axios

### Development & Orchestration
* **Virtual Environment:** Python venv
* **Containerization:** Docker Compose
* **Testing:** Pytest
* **Package Manager:** npm

---

## 📂 Project Structure

```text
DrishtiAI-project/
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database migration scripts
│   │   └── env.py
│   ├── src/
│   │   ├── api/              # API router directories
│   │   │   ├── analytics.py  # Aggregate metrics endpoint
│   │   │   ├── auth.py       # Authentication router
│   │   │   ├── events.py     # Paginated events endpoint
│   │   │   ├── settings.py   # System configs endpoint
│   │   │   └── websockets.py # Redis sub / WS broadcast manager
│   │   ├── core/             # Database connection & security config
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   └── models.py         # SQLAlchemy Base Models
│   ├── alembic.ini           # Alembic config file
│   ├── main.py               # Backend API server startup
│   └── requirements.txt      # Backend Python dependencies
├── ml_worker/                # Headless ML processing background worker
│   ├── core/                 # Shared core visual tracking algorithms
│   │   ├── alerts/
│   │   ├── behaviour/
│   │   ├── detection/
│   │   └── pose/
│   └── worker.py             # Headless pipeline entry point
├── frontend/                 # Next.js web application
│   ├── src/
│   │   ├── app/              # App Router pages and layouts
│   │   │   ├── dashboard/    # Sub-routes: alerts, analytics, events, settings, students
│   │   │   ├── sign-in/      # Login view
│   │   │   ├── globals.css   # Tailwind configurations
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx      # Public landing page
│   │   ├── components/       # Custom React and UI elements
│   │   │   ├── layout/       # Sidebar, Navbar
│   │   │   └── ui/           # Shadcn base elements
│   │   ├── context/          # React AuthContext Provider
│   │   └── lib/              # api.ts client & utility directories
│   ├── components.json       # Shadcn CLI config
│   ├── package.json          # Node dependencies
│   └── .env.example          # Environment variables template
├── tests/                    # Pytest test suites (Unit & Integration)
│   ├── integration/
│   │   └── demo_simulator.py
│   └── unit/
├── src/                      # Legacy monolithic pipeline codebase
│   └── dashboard/            # Legacy Streamlit prototype
│       └── dashboard.py
├── docker-compose.yml        # Local development database & broker setup
├── config.yaml               # Legacy project configurations
├── requirements.txt          # Root Python dependencies (ML, Streamlit)
└── README.md                 # Project README
```

---

## 🛠️ How to Install and Run

### Prerequisites
* **Python** 3.10 to 3.14 installed.
* **Node.js** v18+ and **npm** installed.
* **Docker & Docker Compose** installed.

### 1. Spin up Databases
Run Docker Compose in the project root:
```bash
docker compose up -d
```
This spins up PostgreSQL (`localhost:5432`) and Redis (`localhost:6379`).

### 2. Configure Virtual Environment & Install Dependencies
Create and activate your Python virtual environment, then install dependencies:
```bash
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install packages
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

### 3. Run Database Migrations
Run Alembic migrations to build PostgreSQL tables:
```bash
cd backend
alembic upgrade head
cd ..
```

### 4. Run the Backend API
Start the FastAPI app locally:
```bash
python backend/main.py
```
The API server will launch at: `http://localhost:8000`. You can inspect the Swagger interactive documentation at `http://localhost:8000/docs`.

### 5. Run the Background ML Worker
Start processing video inputs and streaming logs:
```bash
python ml_worker/worker.py
```
*(By default, it will download YOLO weights if not present, process `input videos/04.CCTV Candidate Talking.mkv`, write events to PostgreSQL, and publish them to Redis).*

### 6. Run the Next.js Frontend
From the root directory, navigate to `frontend`, install packages, and boot the web dev server:
```bash
cd frontend
npm install
npm run dev
```
The client app will launch at: `http://localhost:3000`.

### 7. Run the Streamlit Visualizer (Legacy)
```bash
streamlit run src/dashboard/dashboard.py
```
Expected Streamlit port: `http://localhost:8501`.

---

## 🔌 API Overview

| Tag | Method | Endpoint | Purpose | Authorization |
| --- | --- | --- | --- | --- |
| **Auth** | `POST` | `/api/auth/login` | Log in and receive JWT | Public |
| **Events** | `GET` | `/api/events` | Retrieve paginated history of cheating events | Authenticated (JWT) |
| **Analytics**| `GET` | `/api/analytics/summary` | Retrieve count of alerts grouped by type | Authenticated (JWT) |
| **Settings** | `GET` | `/api/settings` | Read system configurations and thresholds | Authenticated (JWT) |
| **Settings** | `PATCH` | `/api/settings` | Update configuration thresholds in real time | Admin Only |
| **WS** | `WS` | `/api/ws/alerts` | Open a WebSocket connection for real-time alerts | Public |
| **System** | `GET` | `/api/health` | API health check | Public |

---

## 🗄️ Database Schema

SQLAlchemy Models are configured inside `/backend/src/models.py`.

### Primary Entities
* **`User`**: Admin and Invigilator accounts with credentials.
  * `id` (PK, Integer)
  * `username` (String, Unique)
  * `password_hash` (String)
  * `role` (Enum: Admin / Invigilator)
* **`Student`**: Represents tracked candidate records.
  * `id` (PK, String - Anonymized ID)
* **`Event`**: Specific alert triggers flagged by the AI.
  * `id` (PK, Integer)
  * `student_id` (FK to `students.id`)
  * `behaviour_type` (String)
  * `confidence` (Float)
  * `explanation` (Text)
  * `timestamp` (DateTime)
  * `keypoints` (JSONB)
* **`SystemConfig` (`settings` table)**: Runtime thresholds.
  * `id` (PK, Integer)
  * `key` (String, Unique)
  * `value` (String)

---

## 🔒 Environment Variables

Database URLs and authorization configurations are configured via environment variables.

### Backend (`/backend/`)
| Variable | Component | Required | Purpose | Default |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Backend / Worker | Optional | Target Postgres connection string | `postgresql://examguard_user:supersecretpassword@localhost:5432/examguard` |
| `REDIS_URL` | Backend | Optional | Target Redis connection string | `redis://localhost:6379` |
| `SECRET_KEY` | Backend | Optional | Token security algorithm secret key | `dummy_secret_for_hackathon` |
| `ALGORITHM` | Backend | Optional | JWT sign algorithm | `HS256` |

### Frontend (`/frontend/`)
Create a `.env.local` file inside the `frontend/` directory to configure variables:
| Variable | Component | Required | Purpose | Default |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Frontend | Yes | API Gateway Host URL | `http://localhost:8000` |

---

## 🧪 Testing

Testing is implemented with `pytest` using unit and integration architectures in the `tests/` directory.

### Running Tests
Make sure your virtual environment is active, then execute:
```bash
.\.venv\Scripts\python -m pytest tests/
```

### Current Status
* **18 tests passing** (0 failures).
* Covered features:
  * Behavior normalization heuristics.
  * Live-loop mock tracking pipelines.
  * Logging configurations and cooldown rules.
  * Simulated candidate cheating scenarios.

---

## 📦 Docker Container Setup

The local environment services are specified in `/docker-compose.yml`:
* **`examguard-postgres`** (image: `postgres:15-alpine`): Exposes port `5432`. Backed by volume `postgres_data`.
* **`examguard-redis`** (image: `redis:7-alpine`): Exposes port `6379`. Backed by volume `redis_data`.

---

## 🔄 Recent Changes

### Next.js Frontend Scaffold
* Configured Next.js 16 + React 19 App Router setup using the latest npm CLI.
* Integrates custom Tailwind CSS v4 variables with a dark-zinc theme.
* Configured core Shadcn UI layout components (Button, Input, Card, Table, Sonner notifications, Skeletons).
* Created a client side authentication gate leveraging global React Context and Axios interceptors.
* Developed 6 distinct subviews mimicking legacy Streamlit capabilities while calling live HTTP REST and WebSocket APIs.

### Backend Scaffolding
* Created FastAPI entry point (`backend/main.py`) and routed modular api subdirectories.
* Switched data storage from a local JSON/CSV file engine to a Relational Database (PostgreSQL).
* Configured Alembic migration environments.

### ML Decoupling
* Completely separated ML YOLO model processes from UI execution blocks.
* Moved headless worker loop to `/ml_worker/worker.py`.

### PubSub and Real-Time Alerts
* Configured Redis message broker.
* Connected worker alert loops to Redis publish methods.
* Developed client-facing WebSocket connections.

---

## ⚖️ Disclaimer

ExamGuard is an experimental AI-assisted monitoring system. Computer vision results can be affected by lighting, camera position, occlusion, image quality, and student posture.

**AI-generated alerts must be treated as signals for human review and not as definitive evidence of cheating or academic misconduct.** For more detailed context, refer to the documentation inside the `info/` directory.

# Drishti AI (ExamGuard) — AI Examination Monitoring System

## 1. Project Overview
Drishti AI (ExamGuard) is an AI-assisted examination monitoring system designed to detect potentially suspicious student behaviors during exams. It uses computer vision to track and analyze student poses and head orientations, generating explainable alerts for human invigilators to review.

**Note:** Drishti AI does not autonomously decide if a student is cheating. The generated alerts serve as signals that require human verification. This project is intended to assist invigilators, not replace them.

---

## 2. Docker Architecture
The system employs a decoupled architecture. The web application infrastructure is fully Dockerized for reproducible local development, while the ML Worker remains natively on the host machine to avoid introducing CUDA/GPU/container complexities.

```mermaid
flowchart TD
    Browser[Browser]
    
    subgraph Docker Compose
      Frontend[Frontend (Next.js)]
      Backend[Backend (FastAPI)]
      DB[(PostgreSQL)]
      Redis[(Redis)]
    end
    
    MLWorker[Native ML Worker\n(Python, YOLO, OpenCV)]
    
    %% External Browser Connections
    Browser -- "http://localhost:3000" --> Frontend
    Browser -- "http://localhost:8000" --> Backend
    Browser -- "http://localhost:5000/video_feed" --> MLWorker
    
    %% Internal Docker Connections
    Backend -- "postgres://db:5432" --> DB
    Backend -- "redis://redis:6379" --> Redis
    Frontend -- "Depends on" --> Backend
    
    %% Native to Docker Connections
    MLWorker -- "postgres://localhost:5432" --> DB
    MLWorker -- "redis://localhost:6379" --> Redis
```

### Dockerized Services:
- **Frontend** (Next.js)
- **Backend** (FastAPI)
- **PostgreSQL** (Database)
- **Redis** (Message Broker)

### Native Host Service:
- **ML Worker** (YOLOv8, OpenCV, MJPEG Server)

---

## 3. Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | Next.js 16.3 / React 19 / TypeScript | Web application framework |
| **Styling** | Tailwind CSS v4 | Utility-first UI styling |
| **Components** | Shadcn UI | Accessible UI primitives |
| **HTTP Client** | Axios | Backend REST communication |
| **Charts** | Recharts | Analytics visualization |
| **Tables** | TanStack Table v8 | Complex event data grids |
| **Forms** | React Hook Form + Zod | Form handling and validation |
| **Backend** | FastAPI | REST API & WebSocket server |
| **Database** | PostgreSQL 15 | Persistent relational storage |
| **Messaging** | Redis 7 | Real-time alert pub/sub |
| **ML Engine** | YOLOv8 + OpenCV | Video processing & pose tracking |
| **Streaming** | MJPEG | Local video stream transport |

---

## 4. Repository Structure

```text
DrishtiAI-project/
├── frontend/                 # Next.js Application (Dockerized)
│   ├── src/                  # App Router pages and UI components
│   ├── Dockerfile            # Multi-stage standalone build
│   └── next.config.ts        # Next.js configurations
├── backend/                  # FastAPI Application (Dockerized)
│   ├── src/                  # API routers, DB core, and models
│   ├── scripts/              # Local seed scripts (e.g., create_admin.py)
│   └── Dockerfile            # Python slim build
├── ml_worker/                # Native ML worker (Not Dockerized)
│   ├── core/                 # YOLO behavior heuristics
│   └── worker.py             # Entrypoint for CV tracking and MJPEG server
├── tests/                    # Pytest test suites
├── docker-compose.yml        # Docker composition for web stack
└── README.md                 # Project Documentation
```

---

## 5. Streamlit → Next.js Migration

The project migrated from a coupled Streamlit monolithic UI to a modern Next.js UI.

| Legacy Streamlit | Current Next.js | Status |
| --- | --- | --- |
| `dashboard.py` | `/dashboard` | Migrated |
| `01_Live_Feeds.py` | `/dashboard/alerts` | Migrated |
| `02_Students.py` | `/dashboard/students` | Partially Migrated |
| `03_Analytics.py` | `/dashboard/analytics` | Migrated |
| `04_Event_Log.py` | `/dashboard/events` | Migrated |
| `05_Settings.py` | `/dashboard/settings` | Migrated |

---

## 6. Current Frontend Pages

| Route | Purpose | Backend API Used | Auth Required |
| --- | --- | --- | --- |
| `/` | Landing page | None | No |
| `/sign-in` | Login portal | `POST /api/auth/login` | No |
| `/sign-up` | Registration portal | `POST /api/auth/register` | No |
| `/dashboard` | System overview | `GET /api/analytics/summary` | Yes |
| `/dashboard/alerts` | Live monitoring | WS / MJPEG Stream | Yes |
| `/dashboard/events` | Event history | `GET /api/events` | Yes |
| `/dashboard/analytics` | Aggregation charts | `GET /api/analytics/summary` | Yes |
| `/dashboard/settings` | System config | `GET` & `PATCH /api/settings` | Yes (Admin) |

---

## 7. Backend API Overview

| Endpoint | Method | Purpose | Auth Required |
| --- | --- | --- | --- |
| `/api/health` | GET | Container health check | No |
| `/api/auth/login` | POST | Authentication & JWT issuance | No |
| `/api/auth/register` | POST | User registration | No |
| `/api/analytics/summary` | GET | Analytics aggregation | Yes |
| `/api/events/` | GET | Event history | Yes |
| `/api/settings/` | GET | Read settings | Yes |
| `/api/settings/` | PATCH | Update settings | Yes (Admin) |
| `/api/ws/alerts` | WS | Real-time alerts broadcaster | No (Current Limitation) |

---

## 8. ML Worker
The ML worker (`ml_worker/worker.py`) is run **natively on the host CPU/GPU** (not inside Docker Compose) to avoid NVIDIA toolkit/passthrough configuration overheads during local development.

1. **YOLO + OpenCV**: Reads video frames and runs YOLOv8 pose estimation.
2. **Behavior Engine**: Evaluates keypoint coordinates (shoulder angle, nose vectors, etc.).
3. **Event Generation**: Exceeding confidence thresholds triggers a database commit to `localhost:5432`.
4. **Publishing**: Instantly publishes alert JSON payloads to Redis via `localhost:6379`.
5. **Video Streaming**: Runs an embedded thread serving MJPEG frames on `localhost:5000/video_feed`.

---

## 9. Real-Time Flow

**Alert Data Flow:**
```text
ML Worker (Native)
 → Redis (Docker :6379)
 → FastAPI WebSocket Listener (Docker)
 → Next.js (Docker :3000)
 → Browser Alert UI
```

**Live Video Flow:**
```text
ML Worker (Native)
 → OpenCV JPEG Encoding
 → FastAPI (Native :5000)
 → Browser <img> (Direct via localhost:5000/video_feed)
```

---

## 10. Environment Variables

> **⚠️ Security Warning:** Never commit real credentials.

### Root Level / Docker Compose (`.env`)
Passed into the `docker-compose.yml` safely.
```env
POSTGRES_USER=examguard_user
POSTGRES_PASSWORD=dummy_local_password
POSTGRES_DB=examguard
JWT_SECRET=dummy_local_secret
```

### Backend (`backend/.env`)
Inside the Docker network, backend resolves `db` and `redis`.
```env
DATABASE_URL=postgresql://examguard_user:dummy_local_password@db:5432/examguard
REDIS_URL=redis://redis:6379
JWT_SECRET=dummy_local_secret
```

### Frontend (`frontend/.env.local`)
Since these are read by the browser, they **must** use `localhost`, not Docker network names!
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_VIDEO_STREAM_URL=http://localhost:5000/video_feed
```

### ML Worker (`ml_worker/.env`)
Since this runs natively, it targets the host's published Docker ports.
```env
DATABASE_URL=postgresql://examguard_user:dummy_local_password@localhost:5432/examguard
REDIS_URL=redis://localhost:6379
```

---

## 11. Local Setup Procedure

Follow these commands to deploy the local development environment:

**1. Copy Environment Variables**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp ml_worker/.env.example ml_worker/.env
```

**2. Start the Docker Stack**
```bash
docker compose up --build -d
```
*This spins up PostgreSQL, Redis, Backend (FastAPI), and Frontend (Next.js).*

**3. Initialize Database Migrations**
The database schema must be deployed via Alembic from the backend container:
```bash
docker compose exec backend alembic upgrade head
```

**4. Start the Native ML Worker (Terminal 2)**
```bash
# Ensure Python 3.10+ virtual env is active, dependencies are installed
python ml_worker/worker.py
```

**5. Access the Platform**
Open `http://localhost:3000` in your web browser.

---

## 12. Temporary Login Bypass

> ⚠️ **Temporary local-development authentication active!**

To instantly bypass the authentication logic and access the dashboard locally, use the following credentials on the `/sign-in` page:
* **Username**: `admin`
* **Password**: `1234`

*Note: This bypass is temporary, insecure, and must be removed before deployment. It does not create a database user, but rather generates a dummy local JWT payload to satisfy the frontend UI Context.*

---

## 13. Database Initialization & Reset

If you need to reset your local database, you can destroy the persistent PostgreSQL volume:

```bash
# WARNING: This deletes all local database data!
docker compose down -v
```

After doing so, you must run migrations again:
```bash
docker compose up -d
docker compose exec backend alembic upgrade head
```

---

## 14. Docker Commands

* **Build & Start**: `docker compose up --build -d`
* **Stop**: `docker compose down`
* **Restart**: `docker compose restart`
* **View Status**: `docker compose ps`
* **View All Logs**: `docker compose logs -f`
* **View Backend Logs**: `docker compose logs -f backend`
* **View Frontend Logs**: `docker compose logs -f frontend`

---

## 15. Troubleshooting Networking Contexts

If connections are failing, ensure you understand the networking boundaries:

### Browser Issues (CORS / Websockets failing)
❌ **Wrong:** `NEXT_PUBLIC_API_URL=http://backend:8000`
✅ **Correct:** `NEXT_PUBLIC_API_URL=http://localhost:8000`
*(Your browser cannot resolve Docker internal DNS)*

### Backend Database Issues
❌ **Wrong:** `DATABASE_URL=...localhost:5432...`
✅ **Correct:** `DATABASE_URL=...db:5432...`
*(The backend container must talk to the db container via Docker DNS)*

### ML Worker Database Issues
❌ **Wrong:** `DATABASE_URL=...db:5432...`
✅ **Correct:** `DATABASE_URL=...localhost:5432...`
*(The native worker running on your OS host talks to Docker via the published host port)*

### Video Feed Unavailable
Verify that `python ml_worker/worker.py` is actively running natively and occupying `localhost:5000`.

---

## 16. Current Limitations

* **ML Worker natively runs**: Local development currently requires a manual, native start of `ml_worker/worker.py` to avoid complex GPU configurations.
* **Temporary hardcoded login**: The `/sign-in` route bypasses real authentication with `admin / 1234`.
* **WebSocket lacks JWT authentication**: Alert streams are completely unauthenticated.
* **Local MJPEG Unencrypted**: Video transport is unencrypted HTTP natively from Python.
* **Pagination limitations**: The backend lacks `total_count` payloads for accurate page sizing in tables.
* **Deployment limitations**: No cloud proxy, HTTPS, or production orchestration is configured yet.

---

## 17. Technical Debt

* **Auth Bypass**: Needs immediate removal before deploying.
* **Shared ML Architecture**: The MJPEG server shares a python thread lock with the YOLO inference loop.
* **Missing Tests**: No end-to-end tests (Cypress/Playwright) for the Next.js frontend exist yet.
* **Schema Redundancies**: Pydantic models and Typescript types are manually synced.

---

## 18. Security Considerations (Pre-Deployment)

The stack is **not deployment-ready**. You must resolve:
1. Removal of `admin/1234` temporary login logic in `frontend/src/app/sign-in/page.tsx`.
2. Secure JWT cookie storage instead of local storage.
3. Secure the `/api/ws/alerts` WebSocket endpoint.
4. Replace `.env.example` dummy passwords with actual secure cloud secret injection.

---

## 19. Future Roadmap

### Phase 1 to 5
Status: **Completed**

### Phase 6 — Real-Time Video & Events
Status: **Completed (Local)**

### Phase 7 — Dockerized Infrastructure
Status: **Completed (Local Compose for Web Stack)**

### Phase 8 — Authentication Hardening
Status: **Future**
* Enforce JWT security.
* Replace temporary login.

### Phase 9 — Future ML Dockerization
Status: **Future**
* Requires evaluating NVIDIA Container Toolkit.
* Requires CUDA-compatible base images.
* Model weights and webcam hardware passthrough handling.
* Not required for immediate local development.

### Phase 10 — Production Deployment
Status: **Future**
* Cloud hosting (e.g., Vercel, AWS ECS).
* Reverse proxy with HTTPS (Nginx / Traefik).

---

## 20. Verification Checklist

**Docker & Backend**
- [ ] `docker compose ps` shows all containers running.
- [ ] `http://localhost:8000/api/health` succeeds.
- [ ] Backend successfully reads/writes to `db:5432`.

**Frontend**
- [ ] `http://localhost:3000` loads.
- [ ] `admin / 1234` bypass logs the user in.
- [ ] Dashboard charts fetch from the backend correctly.

**Native ML Worker**
- [ ] Connects to PostgreSQL at `localhost:5432`.
- [ ] Publishes to Redis at `localhost:6379`.
- [ ] MJPEG Stream plays at `localhost:5000/video_feed`.
- [ ] Alerts appear as Toasts in the frontend via WebSocket.

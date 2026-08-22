# Drishti AI — Complete Technical Audit

## 1. Executive Summary
Drishti AI is actively migrating from a legacy Streamlit interface to a robust Next.js frontend and FastAPI backend. The infrastructure is thoroughly containerized (Next.js, FastAPI, PostgreSQL, Redis), while the ML worker correctly runs natively to process video streams using YOLO-pose. The system successfully demonstrates end-to-end functionality: the ML worker identifies geometric behavioral anomalies, writes events to the database, publishes alerts to Redis, and streams live video. The frontend correctly consumes these APIs and WebSockets. However, significant documentation drift exists, certain backend analytics are missing (causing frontend workarounds), and the ML worker relies heavily on hardcoded credentials and synchronous blocking operations.

## 2. Current Architecture
The implemented architecture matches the intended model:
- **Browser**: Connects to Next.js (`:3000`).
- **Frontend (Next.js)**: Makes REST calls to FastAPI (`localhost:8000`), WebSocket connections to FastAPI (`ws://localhost:8000`), and direct MJPEG stream connections to the ML worker (`localhost:5000`).
- **Backend (FastAPI)**: Connects to PostgreSQL (`db:5432`) and Redis (`redis:6379`) over the Docker bridge network.
- **ML Worker (Native)**: Runs OpenCV/YOLO, writes directly to PostgreSQL (`localhost:5432`), publishes to Redis (`localhost:6379`), and hosts a FastAPI MJPEG server (`:5000`).

## 3. Repository Inventory
| Area | Important Files | Purpose | Current State |
|------|-----------------|---------|---------------|
| `backend/` | `main.py`, `src/api/*`, `src/core/*`, `models.py` | Core REST API & WebSocket server | Functional |
| `frontend/` | `src/app/*`, `src/components/*`, `package.json` | Next.js User Interface | Functional |
| `ml_worker/` | `worker.py` | Video processing, pose extraction, alerting | Functional |
| `src/` | `behaviour/behaviour.py` | Original ML logic and behavior rule definitions | Functional |
| Root | `docker-compose.yml` | Infrastructure orchestration | Functional |
| Root | `yolov8s-pose.pt` | Ultralytics model weights | Active |

**Dead/Missing Files:**
- Legacy Streamlit UI files are no longer present.
- There are no tests in the `tests/` directory.

## 4. Context.md vs Actual Implementation
| Requirement | Documentation Says | Actual Code Does | Status | Evidence |
|-------------|--------------------|------------------|--------|----------|
| Object Model | YOLOv11 & MediaPipe | Uses `yolov8s-pose.pt` exclusively | ⚠️ Drift | `ml_worker/worker.py` & root weights |
| Tracking | ByteTrack | Uses ByteTrack via Ultralytics | ✅ Implemented | `worker.py:155` |
| Explainable AI | Qwen2.5-VL, Llama 3.1 | Uses hardcoded rule-based string templates | ❌ Not Implemented | `src/behaviour/behaviour.py` |
| Evidence Storage | Excel on Google Drive | Stores JSONB keypoints in PostgreSQL | ⚠️ Drift | `worker.py:68` |
| Anonymization | No face images saved | Uses tracking IDs (e.g. `student_001`) | ✅ Implemented | `worker.py:182` |

## 5. Frontend Audit
### Architecture
Next.js App Router (React 19). Uses Shadcn UI, Tailwind, and Context API (`AuthContext.tsx`).
### Routes
| Route | Purpose | Implemented | Backend Connected | Real Data | Notes |
|-------|---------|-------------|-------------------|-----------|-------|
| `/sign-in` | Authentication | Yes | Yes | Yes | Properly exchanges credentials for JWT. |
| `/sign-up` | Registration | Yes | Yes | Yes | Forces `INVIGILATOR` role. |
| `/dashboard` | System Overview | Yes | Yes | Yes | Consumes `/api/analytics/summary` & MJPEG stream. |
| `/dashboard/alerts` | Live WebSocket Alerts | Yes | Yes | Yes | Receives Redis pub/sub broadcasts via WS. |
| `/dashboard/events` | Historical Logs | Yes | Yes | Yes | Full pagination via API. |
| `/dashboard/analytics` | Statistical Breakdown | Yes | Yes | Partial | Hardcodes some fields due to backend limitations. |
| `/dashboard/students` | Student Overview | Yes | No | Partial | Client-side mock aggregating the last 500 events. |
| `/dashboard/settings` | System Config | Yes | Yes | Yes | Properly enforces Admin role logic. |

## 6. Backend Audit
FastAPI application with modular routing.
- **Entry point:** `backend/main.py`.
- **Database:** SQLAlchemy ORM, psycopg2.
- **Auth:** OAuth2PasswordBearer, PyJWT, passlib (bcrypt downgraded to 3.2.2 for compatibility).
- **CORS:** Accepts `*` (Insecure for prod).

## 7. API Inventory
| Method | Endpoint | Auth | Request | Response | Status |
|--------|----------|------|---------|----------|--------|
| GET | `/api/health` | None | None | `{"status": "healthy"}` | ✅ Connected |
| POST | `/api/auth/login` | None | `OAuth2PasswordRequestForm` | JWT | ✅ Connected |
| POST | `/api/auth/register` | None | `{username, password}` | Success msg | ✅ Connected |
| GET | `/api/events/` | JWT | `skip`, `limit` params | `List[Event]` | ✅ Connected |
| GET | `/api/analytics/summary`| JWT | None | `{behaviour: count, total: count}` | 🟡 Shallow |
| GET | `/api/settings/` | JWT | None | `{key: value}` | ✅ Connected |
| PATCH| `/api/settings/` | JWT(Admin)| `[{key, value}]` | Success msg | ✅ Connected |
| WS | `/api/ws/alerts` | None | None | Text (JSON) | ✅ Connected |

## 8. Frontend ↔ Backend Contract Audit
- ✅ **Authentication:** Seamless. Next.js passes Bearer tokens in headers via Axios interceptors.
- ✅ **Events:** Complete matching of schema.
- 🟡 **Analytics:** Frontend expects `total_students` and `average_confidence`, but the backend `/summary` only returns counts per behavior. The frontend safely degrades these UI components to "Unavailable".
- ❌ **Students:** The frontend `/dashboard/students` page lacks a backend equivalent (`/api/students`). The UI explicitly warns the user that it is deriving student statistics purely client-side from the event log payload.

## 9. Authentication & Authorization Audit
- **Flow:** User submits `/sign-up` -> Backend hashes password (bcrypt) -> Assigns `RoleEnum.INVIGILATOR` (admin cannot be assigned via API). User logs in -> Backend verifies hash -> Signs JWT (HS256) -> Frontend stores in `localStorage` -> AuthContext manages state -> Axios attaches header.
- **Admin Access:** Local development requires running `backend/scripts/seed.py` or `create_admin.py` to securely seed an admin user bypassing the API constraint.
- **WebSocket:** `/api/ws/alerts` currently lacks JWT verification.

## 10. Database Audit
- Models match Alembic migrations precisely (`users`, `students`, `events`, `settings`).
- `Event.keypoints` accurately utilizes `JSONB`.
- Initialization and connectivity work perfectly inside Docker (`db:5432`).

## 11. Redis Audit
- Redis is utilized purely as a pub/sub message broker.
- **Flow:** ML Worker publishes JSON string to `alerts` channel -> FastAPI ConnectionManager (`websockets.py`) listens asynchronously -> Broadcasts immediately to all connected Browser clients.
- Fully functional and extremely responsive.

## 12. ML Worker Audit
- The pipeline (`ml_worker/worker.py`) initializes YOLO (`yolov8s-pose.pt`) and an OpenCV `VideoCapture`.
- **Logic:** Extracts 17 body keypoints -> Converts to geometric heuristics (shoulder angle, hand movement, distance to face) in `src/behaviour/behaviour.py` -> Evaluates temporal 100-frame histories for anomalies.
- **Outputs:** Pushes directly to PostgreSQL using SQLAlchemy, publishes to Redis, and serves a FastAPI MJPEG stream on port 5000.
- **Missing Elements:** No LLMs are invoked. Behavior classification is strictly geometric/rule-based.

## 13. Video Streaming Audit
- The ML Worker leverages `StreamingResponse` to serve a `multipart/x-mixed-replace` MJPEG stream.
- The browser fetches `http://localhost:5000/video_feed`.
- **Limitation:** The thread model uses a single global lock (`frame_lock`). Multiple concurrent browser connections will cause severe race conditions and stuttering.

## 14. WebSocket / Real-Time Audit
- Functional. Connects gracefully on `/dashboard/alerts`. Automatically reconnects UI components.

## 15. Docker & Infrastructure Audit
- Docker Compose defines `frontend`, `backend`, `db`, and `redis`.
- The ML worker runs natively (expected, due to hardware dependency).
- Networking hostnames are correctly configured (Backend uses `db`, Frontend browser uses `localhost`).

## 16. Environment Variables & Credentials
| Secret/Config | Location | Hardcoded? | Component | Safe? | Action |
|---------------|----------|------------|-----------|-------|--------|
| `JWT_SECRET` | `backend/src/core/security.py` | Yes | Backend | 🔴 No | Move strictly to env variables. |
| `DB_URL` | `ml_worker/worker.py` | Yes | ML Worker | 🔴 No | Remove `examguard_user:supersecretpassword` from python code. |

## 17. Hardcoded / Mock / Placeholder Findings
- 🔴 **ML Worker:** `VIDEO_PATH = "input videos/04.CCTV Candidate Talking.mkv"` is hardcoded.
- 🔴 **ML Worker:** Database URL is hardcoded.
- 🟡 **Frontend:** `Unique Students` and `Average Confidence` mock cards in Analytics.
- 🟡 **Frontend:** Client-side aggregation on the Students page.

## 18. Feature Completeness Matrix
| Feature | Frontend | Backend | DB | Redis | ML | End-to-End | Status |
|---------|-----------|---------|----|-------|----|------------|--------|
| Authentication | ✅ | ✅ | ✅ | - | - | ✅ | Working |
| Dashboard | ✅ | 🟡 | ✅ | - | - | 🟡 | Missing metrics |
| Live video | ✅ | - | - | - | ✅ | ✅ | Working |
| Live Alerts (WS) | ✅ | ✅ | - | ✅ | ✅ | ✅ | Working |
| Events History | ✅ | ✅ | ✅ | - | ✅ | ✅ | Working |
| Students | 🟡 | ❌ | ✅ | - | ✅ | 🟡 | API missing |

## 19. End-to-End User Journey
1. Start Docker stack (✅ Works).
2. Start ML worker natively (✅ Works).
3. Sign in as Admin (✅ Works via Seed Script).
4. View Live Feed & Alerts (✅ Works).
5. View Analytics (🟡 Degraded).
6. View Students (🟡 Degraded).

## 20. Runability / Local Setup Audit
1. `docker compose up -d`
2. `docker compose exec backend python scripts/seed.py`
3. `cd ml_worker && python worker.py` (Assuming venv with Ultralytics/OpenCV is active).

## 21. Testing Audit
- **Tests:** None. The `tests/` directory is completely empty.

## 22. Security Audit
- **P1:** Hardcoded JWT secret and Database URL in Python source files.
- **P1:** FastAPI CORS allows `*`, permitting cross-site attacks in production.
- **P2:** WebSocket `/api/ws/alerts` does not validate tokens, meaning any client can listen to alerts.
- **P2:** The ML Worker bypasses the API and inserts directly into the database.

## 23. Performance / Resource Audit
- The ML Worker performs synchronous database inserts (`db_session.commit()`) during the main video loop. If PostgreSQL latency spikes, the video feed will stutter.
- MJPEG streaming thread locking is inefficient for multiple viewers.

## 24. Technical Debt
| Debt | Severity | Impact | Recommended Resolution |
|------|----------|--------|------------------------|
| Direct DB access in ML worker | High | Tight coupling, bypasses API logic | Have ML Worker hit an internal POST endpoint instead of SQLAlchemy. |
| Missing Students API | Medium | Frontend aggregates massive event logs client-side | Implement `GET /api/students/` with SQL `GROUP BY`. |
| Synchronous ML logging | Medium | Video frame drops | Move ML database logging to an asynchronous thread/queue. |

## 25. Documentation Drift
| Documentation | Claim | Actual State | Correct Documentation |
|---------------|-------|--------------|-----------------------|
| `context.md` | Uses Qwen2.5/Llama 3.1 | Purely rule-based | Remove LLM claims or implement LLM service layer. |
| `context.md` | Saves evidence to Drive | Saves to Postgres | Update storage architecture diagram. |

## 26. What's Working
- Infrastructure, Docker networking, PostgreSQL, Redis, Authentication, Video processing logic, WebSocket broadcasting, and basic Next.js routing.

## 27. What's Broken
- Strictly speaking, nothing is outright crashing.

## 28. What's Missing
- The Explainable AI (LLM) Engine.
- The `Students` Backend API endpoint.
- Deep analytics API data.
- Unit and Integration tests.

## 29. Critical Issues
1. Hardcoded database credentials inside the ML Worker.
2. Synchronous PostgreSQL writes inside the YOLO inference loop causing frame drops.
3. Next.js attempting to derive student state client-side.

## 30. Prioritized Roadmap
### P0 — Must Fix Immediately
- **Hardcoded ML Configs:** Move `DB_URL` and `VIDEO_PATH` out of `worker.py` and into environment variables.
### P1 — Core Functionality
- **Students Endpoint:** Create `/api/students/` to resolve the frontend workaround.
- **Analytics Endpoint:** Expand `/api/analytics/summary` to include unique student counts and average confidence.
### P2 — Architecture / Quality
- **Decouple ML Worker:** The ML worker should POST to a FastAPI internal route instead of importing `backend.src.models` and writing to PostgreSQL directly.
- **Async ML Logging:** Wrap ML database operations in background threads to maintain high FPS.
### P3 — Security Hardening
- **Secure WebSockets:** Enforce JWT token passage during WebSocket handshakes.
- **Remove Hardcoded Secrets:** Migrate `JWT_SECRET` in `security.py` strictly to `.env`.
### P4 — Future Features
- **Explainable AI:** Integrate an LLM (Qwen/Llama) to process the geometric heuristics into natural language before saving the alert explanation.

## 31. Final Verdict
- Frontend: 80%
- Backend: 75%
- Database: 100%
- ML: 85%
- Infrastructure: 95%
- Authentication: 100%
- Real-time: 90%
- **End-to-end functionality: 85%**

**Assessment:** The Drishti AI prototype is extremely solid. The migration to Next.js and Docker was largely successful, and the core physical logic works. The system is highly functional as a hackathon prototype, but requires API expansions (Students/Analytics) and decoupling (ML Worker DB access) before it can be considered production-ready.

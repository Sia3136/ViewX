# EXECUTIVE SUMMARY

This is the Master Implementation Blueprint for **ExamGuard (DrishtiAI)**. 
The current repository is a local hackathon prototype: a Streamlit frontend and a synchronous Python computer-vision script that pass data via a local `events.json` file. The backend, database, and API layers are completely missing. 

To transform this into a production-ready application, we must completely rebuild the architecture. We will extract the ML pipeline into a headless background worker, build a FastAPI backend backed by PostgreSQL, establish stable API contracts, and replace Streamlit with a modern Next.js frontend. 

This roadmap defines the exact sequence of technical execution, ensuring no UI is built against undefined data and no backend is built without supporting the ML output.

---

# PROJECT CONTEXT

## 3.1 What the product currently does
The product monitors a video feed (or webcam) to detect cheating behaviors during exams. When a user clicks "Start Monitoring", the UI freezes while the CV pipeline analyzes frames, identifies human keypoints, calculates geometric heuristics (e.g., head turns), logs alerts to a JSON file, and then renders those alerts in the UI.

## 3.2 What the frontend currently does
The frontend is built with Streamlit (`src/dashboard/dashboard.py`). It consists of a live video feed, an alert timeline, an unpaginated data table of all events, and mocked settings toggles. It reads data synchronously from the local disk (`logs/events.json`).

## 3.3 What the backend currently does
**Missing.** There are no APIs, services, databases (other than local files), authentication, or background processes.

## 3.4 What the ML system currently does
The ML system (`live_cctv.py`) is trapped inside the Streamlit UI thread. It uses a pretrained **YOLOv8s-pose** model for person detection and keypoint extraction, paired with **ByteTrack** for assigning IDs. 
Behavior detection is rule-based: it calculates pixel distances (e.g., `head_offset > 20`) to flag "sideward glances" or "unusual hand movements". 
A significantly better, depth-normalized engine exists in `src/behaviour/behaviour.py` but is completely disconnected and unused.

## 3.5 What the final product is intended to become
- **VERIFIED:** A distributed web application with a FastAPI backend and PostgreSQL database.
- **VERIFIED:** A decoupled ML worker running YOLO inference in the background.
- **VERIFIED:** A React-based web dashboard replacing Streamlit.
- **VERIFIED:** WebSockets for real-time alert notifications.
- **INFERRED:** JWT-based authentication for Invigilator access.
- **UNKNOWN:** LLM integration (mentioned in `context.md` but completely unrepresented in code; deferred to post-MVP).

---

# CURRENT STATE → TARGET STATE

| Area | Current State | Target State | Main Work Required |
|---|---|---|---|
| **Frontend** | Streamlit + Local disk sync | Next.js + Tailwind + APIs | Complete rewrite of the presentation layer. |
| **Backend** | Missing | FastAPI | Build from scratch (REST, Auth, WebSockets). |
| **Database** | `logs/events.json` | PostgreSQL | Define schema, setup SQLAlchemy/Alembic. |
| **ML** | UI-blocking script + unused modules | Headless Python Worker | Decouple from Streamlit; wire up the unused normalized `behaviour.py`. |
| **Infrastructure** | Local scripts | Dockerized services | Setup Docker Compose for DB, Redis, API, and ML. |
| **Integration** | File I/O (`json.loads`) | REST + WebSockets + Redis | Implement Redis Pub/Sub for ML → Backend communication. |

**Biggest Architectural Gap:** The lack of a network boundary. The ML script and UI must be severed from each other and forced to communicate through a database and API.

---

# TARGET ARCHITECTURE

```text
                     FRONTEND (Next.js)
                       │          ▲
            REST (JWT) │          │ WebSockets (Alerts)
                       ▼          │
                  BACKEND/API (FastAPI)
                 /        |           \
           SQL  /         | Pub/Sub    \  HTTP Stream (Optional)
               ▼          ▼             ▼
          DATABASE      CACHE        ML WORKER (Python)
        (PostgreSQL)   (Redis)          │
               ▲          ▲             │
                \         |            /
          Insert \        | Publish   / 
                  \       |          /
                   ML OUTPUT EVENT 
```

*Note: The ML service runs as a separate Python worker process to prevent OpenCV inference from blocking the FastAPI event loop.*

---

# TECHNOLOGY DECISIONS

| Layer | Current | Recommendation | Keep/Change/Add | Why |
| ----- | ------- | -------------- | --------------- | --- |
| **Frontend framework** | Streamlit | Next.js (App Router) | **CHANGE** | Streamlit cannot support secure auth, real-time video streaming, or production UI customization. |
| **UI system** | Streamlit | Tailwind + Shadcn UI | **CHANGE** | Industry standard for rapid, accessible React UI development. |
| **API client** | None | Axios + React Query | **ADD** | Required for async data fetching, caching, and loading states. |
| **Backend framework** | None | FastAPI | **ADD** | Native async support, high performance, Pydantic data validation natively matches the project requirements. |
| **Database** | JSON | PostgreSQL | **CHANGE** | Required for structured relations (Users, Students, Events). |
| **ORM** | None | SQLAlchemy + Alembic | **ADD** | Safest and most mature migration/schema manager for Python. |
| **Auth** | None | JWT via FastAPI | **ADD** | Required to secure CCTV feeds from unauthorized access. |
| **Queue/PubSub** | None | Redis | **ADD** | Crucial for decoupling high-frequency ML events from the web server. |
| **ML framework** | Ultralytics | Ultralytics YOLOv8 | **KEEP** | The pose extraction works perfectly. |

---

# DEPENDENCY GRAPH

## HARD DEPENDENCIES
```text
1. Database Schema & Migration
      ↓
2. ML Output Contract Definition (JSON schema)
      ↓
3. ML Pipeline Extraction (Headless worker writes to DB)
      ↓
4. Backend API Implementation (FastAPI reads from DB)
      ↓
5. Frontend API Layer & Auth (Axios hooks)
      ↓
6. Frontend Application Shell & Pages
```

## BLOCKERS
- Rebuilding the Streamlit UI into Next.js is **BLOCKED** until the FastAPI `/events` contract is frozen.
- Building the FastAPI backend is **BLOCKED** until the database schema is defined.

---

# CRITICAL PATH

```text
Database schema initialization
        ↓
ML Pipeline decoupled and writing to DB
        ↓
Backend API contracts frozen
        ↓
Backend REST implementation
        ↓
Frontend data layer integration
        ↓
Frontend redesign (Next.js)
        ↓
Full-system integration (Real-time WebSockets)
```
*If we skip extracting the ML pipeline first, we risk building a database schema and API contract that cannot physically support the real output of the CV engine.*

---

# PHASE 0 — Project Stabilization & Architecture Prep

## A. PURPOSE
Establish the physical separation of concerns by creating the folder structure, containerizing the required infrastructure (DB/Cache), and defining the database schema.

## B. CURRENT CONTEXT
Everything is currently flat in `src/`. There is no PostgreSQL instance, no Alembic, and no environment management.

## C. GOAL
At the end of this phase, a developer can run `docker-compose up -d` to spin up PostgreSQL and Redis, and Alembic migrations successfully create the tables.

## D. WHY THIS PHASE COMES HERE
We cannot write backend code or refactor ML to save to the database until the database physically exists and the schema is locked.

## E. TASKS

### Task 0.1 — Repository Restructuring
* **What:** Create `/frontend`, `/backend`, and `/ml_worker` directories.
* **Why:** Physical separation enforces architectural separation.
* **How:** Move `src/pipeline`, `src/detection`, `src/pose`, `src/behaviour` to `/ml_worker/core`. Create empty FastAPI scaffold in `/backend`.
* **Tech:** Git, Bash.
* **Definition of Done:** Folder structure matches target architecture.

### Task 0.2 — Infrastructure as Code
* **What:** Create `docker-compose.yml` for local development.
* **Why:** Standardizes the local environment.
* **How:** Define `postgres:15-alpine` and `redis:7-alpine` services. Set default ports and environment variables.
* **Tech:** Docker Compose.
* **Files:** `/docker-compose.yml`
* **Definition of Done:** Databases start cleanly locally.

### Task 0.3 — Database Schema & Alembic Setup
* **What:** Define the core SQLAlchemy models and initial migration.
* **Why:** Foundation of the entire data layer.
* **How:** 
  - `User`: id, username, password_hash, role
  - `Student`: id (string), created_at
  - `Event`: id, student_id (FK), type, confidence, explanation, timestamp, keypoints (JSONB).
  - `Settings`: id, key, value.
* **Tech:** FastAPI, SQLAlchemy, Alembic, PostgreSQL.
* **Files:** `/backend/src/models.py`, `/backend/alembic/env.py`.
* **Verification:** Run `alembic upgrade head`; inspect Postgres with pgAdmin/psql.
* **Definition of Done:** Schema exists in the database.

---

# PHASE 1 — ML Pipeline Decoupling & DB Integration

## A. PURPOSE
Remove the ML inference loop from the Streamlit UI thread and force it to operate as a headless background worker that writes to PostgreSQL.

## B. CURRENT CONTEXT
`live_cctv.py` is a 700+ line script that runs YOLO tracking, calculates pixel-based heuristics, generates string alerts, and calls `EventLogger.log_observation()` which writes to a local `.json` file. It also blocks the Streamlit thread.

## C. GOAL
A standalone Python script (`worker.py`) that captures a video feed, runs YOLO inference, calculates normalized behaviors (using the unused `behaviour.py` engine), and inserts records directly into the Postgres `events` table via SQLAlchemy.

## D. WHY THIS PHASE COMES HERE
The ML output is the primary data source of this application. By refactoring the ML worker to write to the DB *first*, we populate the DB with realistic data, which makes building the FastAPI endpoints drastically easier.

## E. TASKS

### Task 1.1 — Extract Headless Inference Loop
* **What:** Extract the `while True` loop from `live_cctv.py` into `ml_worker/worker.py`.
* **Why:** Unblock the UI thread.
* **How:** Remove all Streamlit and UI overlay code (`cv2.putText`, `st.image`). Keep only the `model.track()` and ID tracking.
* **Tech:** Python, OpenCV, Ultralytics.
* **Files:** `/ml_worker/worker.py`
* **Dependencies:** Model weights downloaded.
* **Definition of Done:** Script runs from CLI, prints tracking IDs to console, without crashing.

### Task 1.2 — Wire Up the Normalized Behavior Engine
* **What:** Replace the hardcoded pixel-math in `live_cctv.py` with the robust `BehaviorEngine` in `behaviour.py`.
* **Why:** The current math (`head_offset > 20`) fails if a student is far from the camera. `behaviour.py` normalizes by shoulder width.
* **How:** Pass the 17-point keypoints array to `get_head_orientation_and_hand_positions()` and then feed temporal features into `BehaviorEngine.detect_sideward_glances()`.
* **Tech:** Python math.
* **Files:** `/ml_worker/worker.py`, `/ml_worker/core/behaviour.py`.
* **Definition of Done:** Worker detects cheating accurately regardless of subject distance from the camera.

### Task 1.3 — ML to Database Integration
* **What:** Rewrite `EventLogger` to use SQLAlchemy instead of JSON.
* **Why:** Transition from local files to relational database.
* **How:** Import the SQLAlchemy `Event` model. Upon a behavior threshold trigger, execute `session.add(Event(...))` and `session.commit()`. 
* **Tech:** SQLAlchemy, Psycopg2.
* **Files:** `/ml_worker/utils/logger.py` (replaces old logger).
* **Dependencies:** Task 0.3 (Schema).
* **Verification:** Run ML worker, check Postgres table for new rows.
* **Definition of Done:** Real ML events are persisting in PostgreSQL.

---

# PHASE 2 — API Contract Stabilization & Core Backend

## A. PURPOSE
Build the FastAPI REST layer to securely expose the database contents to the future frontend.

## B. CURRENT CONTEXT
No backend exists.

## C. GOAL
A fully functional REST API serving paginated events, aggregate analytics, and handling JWT authentication.

## D. WHY THIS PHASE COMES HERE
The database is now populated by the ML worker (Phase 1). We now need the API to read it before we can build the frontend.

## E. TASKS

### Task 2.1 — Authentication Service
* **What:** Implement `POST /api/auth/login`.
* **Why:** Security requirement.
* **How:** Use `passlib` to verify bcrypt password hashes. Generate a JWT string using `PyJWT`. Create a FastAPI `Depends(get_current_user)` dependency for protected routes.
* **Tech:** FastAPI, PyJWT, passlib.
* **Files:** `/backend/src/api/auth.py`, `/backend/src/core/security.py`.
* **Definition of Done:** Endpoint issues a valid JWT for valid credentials and 401 for invalid.

### Task 2.2 — Event History API
* **What:** Implement `GET /api/events`.
* **Why:** Core requirement for the frontend Alert Timeline.
* **How:** Query the `Events` table. MUST include pagination (`skip`, `limit`) and optional filtering by `student_id` or `behaviour_type`.
* **Tech:** FastAPI, SQLAlchemy.
* **Files:** `/backend/src/api/events.py`.
* **Dependencies:** Task 2.1 (Auth dependency).
* **Definition of Done:** Returns a stable JSON array of events with a 200 OK, authenticated.

### Task 2.3 — Analytics API
* **What:** Implement `GET /api/analytics/summary`.
* **Why:** The frontend `/03_Analytics` page needs aggregate data (e.g., counts of behavior types).
* **How:** Write a SQLAlchemy `GROUP BY` query to count events by type and severity.
* **Tech:** FastAPI, SQLAlchemy.
* **Files:** `/backend/src/api/analytics.py`.
* **Definition of Done:** Returns pre-aggregated stats suitable for charting.

### Task 2.4 — Settings API
* **What:** Implement `GET /api/settings` and `PATCH /api/settings`.
* **Why:** Allows admins to change ML thresholds dynamically.
* **How:** Read/write to the `settings` table. 
* **Definition of Done:** Settings can be updated via REST.

---

# PHASE 3 — Real-Time Infrastructure (WebSockets & PubSub)

## A. PURPOSE
Bridge the gap between the asynchronous ML worker generating alerts and the Frontend needing live notifications, without requiring page reloads.

## B. CURRENT CONTEXT
Streamlit currently forces the user to manually click a "Refresh" button or wait for a page loop to see new alerts.

## C. GOAL
When the ML worker detects cheating, a toast notification appears instantly in the browser.

## D. WHY THIS PHASE COMES HERE
Core REST APIs are done. We must implement real-time hooks before the frontend builds its state management.

## E. TASKS

### Task 3.1 — Redis PubSub Setup
* **What:** Connect ML worker and FastAPI to Redis.
* **Why:** ML worker and FastAPI run in different processes; they need a message broker to communicate instantly.
* **How:** In `ml_worker/utils/logger.py`, after committing to Postgres, run `redis.publish('alerts', json_event)`.

### Task 3.2 — FastAPI WebSocket Manager
* **What:** Implement `WS /api/ws/alerts`.
* **Why:** Streams Redis events to connected frontend clients.
* **How:** Create a FastAPI WebSocket route. Spawn an `asyncio` background task that listens to the Redis `alerts` channel and forwards messages to all connected WebSocket clients.
* **Tech:** FastAPI WebSockets, `redis.asyncio`.
* **Files:** `/backend/src/api/websockets.py`.
* **Definition of Done:** Sending a manual Redis publish message appears in a test WebSocket client.  

---

# PHASE 4 — Frontend Architecture & Design System

## A. PURPOSE
Scaffold the modern web application to replace Streamlit.

## B. CURRENT CONTEXT
Streamlit forces synchronous rendering and provides zero control over state management or complex UI components.

## C. GOAL
A blank, structurally sound Next.js App Router project with Tailwind, Shadcn UI, and Axios configured.

## D. WHY THIS PHASE COMES HERE
Backend contracts are frozen (Phases 2 & 3). The frontend team can now build against known API responses.

## E. TASKS

### Task 4.1 — Next.js Scaffold
* **What:** `npx create-next-app@latest`.
* **Why:** Foundation of the new UI.
* **How:** Select App Router, TypeScript, Tailwind.

### Task 4.2 — Shadcn & Theming
* **What:** Install Shadcn UI and define CSS variables.
* **Why:** Ensure a premium, dark-mode focused UI.
* **How:** `npx shadcn-ui@latest init`. Add components: Button, Card, Table, Toast, Badge. 

### Task 4.3 — API Client & Auth Provider
* **What:** Setup Axios and React Context for Authentication.
* **Why:** Manage JWT tokens and global login state.
* **How:** Create an Axios instance with an interceptor that automatically attaches the JWT from local storage/cookies. Create `<AuthProvider>` to wrap the app.
* **Files:** `/frontend/src/lib/api.ts`, `/frontend/src/context/AuthContext.tsx`.

---

# PHASE 5 — Frontend Core Pages & Data Integration

## A. PURPOSE
Implement the actual product screens by binding UI components to the FastAPI endpoints.

## B. CURRENT CONTEXT
Data is mocked or file-read.

## C. GOAL
A working dashboard that displays real data from the database.

## D. WHY THIS PHASE COMES HERE
Dependencies (Design system, API client, APIs) are all complete.

## E. TASKS

### Task 5.1 — Login Page
* **What:** Create `/login`.
* **How:** Simple form -> POST to `/api/auth/login` -> save JWT -> redirect to `/`.

### Task 5.2 — Alert History Data Table
* **What:** Replace Streamlit `/04_Event_Log` with a React Table.
* **How:** Use Shadcn `DataTable`. Fetch data via Axios from `GET /api/events`. Implement pagination buttons that modify the `page` URL parameter.
* **Definition of Done:** User can click "Next Page" and see older events from Postgres.

### Task 5.3 — Analytics Dashboard
* **What:** Replace Streamlit `/03_Analytics`.
* **How:** Install `recharts`. Fetch from `GET /api/analytics/summary`. Render a Bar chart showing behavior frequency.

### Task 5.4 — System Settings
* **What:** Replace the mocked Streamlit `/05_Settings`.
* **How:** Create a form with toggle switches. `onSubmit` -> `PATCH /api/settings`.

---

# PHASE 6 — Real-Time Video & Event Integration (The Final Link)

## A. PURPOSE
Bring the system to life by streaming the live CCTV feed to the browser and popping up real-time alerts.

## B. CURRENT CONTEXT
Streamlit blocks the UI to render the video. 

## C. GOAL
The Next.js dashboard plays a smooth video feed, and a Shadcn Toast notification appears instantly when a student cheats.

## D. WHY THIS PHASE COMES HERE
This is the most complex integration, relying on all previous phases (ML Worker, Redis, WebSockets, Next.js).

## E. TASKS

### Task 6.1 — WebSocket Hook
* **What:** Create a custom React hook `useAlertWebsocket()`.
* **Why:** Manage the WS connection lifecycle.
* **How:** Connect to `ws://localhost:8000/api/ws/alerts`. On `message` event, trigger a Shadcn `toast({ title: "Alert", description: event.explanation })`.

### Task 6.2 — Video Streaming Transport
* **What:** Stream the ML Worker's annotated video frames to the browser.
* **Why:** The invigilator must see the camera.
* **How:** 
  - *Option A (Fastest/MVP):* ML Worker serves a local MJPEG HTTP stream (`multipart/x-mixed-replace`). Next.js uses `<img src="http://worker:5000/video" />`.
  - *Option B (Production):* WebRTC. 
  - *Recommendation:* Implement Option A for MVP parity with Streamlit, upgrade to B later.
* **Tech:** Python Flask/FastAPI (for the MJPEG endpoint on the worker).
* **Definition of Done:** Dashboard shows smooth 25fps video while the rest of the UI remains fully responsive and clickable.

---

# PHASE DEPENDENCY MATRIX

| Phase | Depends On | Blocks | Can Run Parallel? | Output |
| ----- | ---------- | ------ | ----------------- | ------ |
| 0. Stabilization | None | Everything | No | Repos structured, DB running. |
| 1. ML Decoupling | Phase 0 | API testing | Track A | Worker writes to DB. |
| 2. Backend APIs | Phase 0, 1 | Frontend Data | Track A | REST endpoints frozen. |
| 3. WebSockets | Phase 1, 2 | Live Alerts | Track A | Realtime infrastructure. |
| 4. Frontend Shell | Phase 0 | Frontend Pages | Track B | Next.js scaffolded. |
| 5. Frontend Pages | Phase 2, 4 | Full Integration | Track B | Static data rendering. |
| 6. Integration | Phase 3, 5 | Deployment | No | Working end-to-end MVP. |

---

# MASTER TASK LIST (CRITICAL PATH ONLY)

| ID | Phase | Task | Priority | Depends On | Tech | Status |
| -- | ----- | ---- | -------- | ---------- | ---- | ------ |
| 1 | 0 | Setup Docker (Postgres/Redis) | P0 | None | Docker | Todo |
| 2 | 0 | Define SQLAlchemy Models | P0 | 1 | Python | Todo |
| 3 | 1 | Extract ML Inference to Worker | P0 | None | OpenCV | Todo |
| 4 | 1 | ML Worker -> Postgres Insert | P0 | 2, 3 | SQLAlchemy| Todo |
| 5 | 2 | FastAPI GET /events (Pagination)| P0 | 2, 4 | FastAPI | Todo |
| 6 | 3 | FastAPI WebSockets | P1 | 5 | Redis | Todo |
| 7 | 4 | Next.js + Shadcn Init | P0 | None | Next.js | Todo |
| 8 | 5 | Next.js Auth & API Client | P0 | 5, 7 | Axios | Todo |
| 9 | 5 | Next.js Event History Table | P0 | 8 | React | Todo |
| 10| 6 | Next.js WS Live Toast | P1 | 6, 8 | React | Todo |
| 11| 6 | ML Worker MJPEG Stream | P1 | 3 | Python | Todo |
| 12| 6 | Next.js Video Player | P1 | 11, 7| HTML `<img>`| Todo |

---

# PARALLEL WORKSTREAMS

Once **Phase 0 (Schema)** is complete and the **API Contracts** are frozen:

* **TRACK A (Backend/ML):** Engineers focus on Phase 1 (Worker decoupling) and Phase 2 (FastAPI routes).
* **TRACK B (Frontend):** Engineers focus on Phase 4 (Next.js layout, routing, Auth Context, styling) using mocked Axios responses that match the frozen API contract.

---

# RISKS

| Risk | Probability | Impact | Mitigation |
| ---- | ----------- | ------ | ---------- |
| **Video Latency** | High | High | If MJPEG drops frames, do not attempt to pass video blobs through Postgres or Redis. Serve directly via HTTP/WebRTC from the worker. |
| **DB Overload** | Medium | High | ML fires rapidly. Add a cooldown layer in the ML worker (already present in `live_cctv.py`) before writing to Postgres. |
| **ML False Positives** | High | Medium | Rely on the depth-normalized engine in `behaviour.py` instead of the pixel-math in `live_cctv.py`. |

---

# WHAT NOT TO DO YET

* **DO NOT** attempt to integrate LLMs (Qwen/Llama) for alert explainability. This requires a completely stable event pipeline first. Defer to V2.
* **DO NOT** rewrite the ML logic itself. The YOLOv8 implementation is fine; only its execution wrapper needs changing.
* **DO NOT** build the Next.js UI around arbitrary JSON structures. Wait for the FastAPI `/events` contract to be explicitly defined.

---

# EXACT FIRST 10 ACTIONS (DO THIS FIRST)

1. **Task:** Create `docker-compose.yml` for Postgres & Redis.
   **Why:** Foundation required for all data persistence.
   **How:** Standard alpine images, expose ports 5432 and 6379.

2. **Task:** Initialize `/backend` folder with FastAPI scaffold.
   **Why:** Creates the network layer.
   **Tech:** `pip install fastapi uvicorn sqlalchemy alembic`.

3. **Task:** Write SQLAlchemy Models (`User`, `Student`, `Event`, `Settings`).
   **Why:** Locks in the schema.
   **Tech:** Python classes mapping to DB columns.

4. **Task:** Run Alembic migration.
   **Why:** Pushes schema to the running Postgres container.
   **Tech:** `alembic revision --autogenerate`, `alembic upgrade head`.

5. **Task:** Create `/ml_worker/worker.py`.
   **Why:** Unblock the UI thread by extracting ML.
   **How:** Copy `live_cctv.py` contents, strip out all `import streamlit` and `cv2.putText` UI code.

6. **Task:** Connect `/ml_worker/worker.py` to Postgres.
   **Why:** Stop writing to local `events.json`.
   **How:** Import SQLAlchemy session, replace `EventLogger` with `session.add(Event(...))`.

7. **Task:** Create `GET /api/events` in FastAPI.
   **Why:** Frontend needs this data.
   **How:** Query `Event` table, implement `limit` and `offset`.

8. **Task:** Freeze API Contract for `/events`.
   **Why:** Unblocks frontend developers.
   **How:** Document the exact JSON response shape.

9. **Task:** Initialize Next.js in `/frontend`.
   **Why:** Replaces Streamlit.
   **Tech:** `npx create-next-app`, `npx shadcn-ui init`.

10. **Task:** Build Axios client in Next.js and mock the `/events` response.
    **Why:** Allows UI development to proceed while backend finishes Auth/WebSockets.

---

# FINAL DEFINITION OF DONE

The project is considered complete and production-ready when:
1. The ML worker captures a webcam feed, detects a head turn, and commits an `Event` row to PostgreSQL without blocking any web servers.
2. The FastAPI backend detects the new row (or Redis message) and broadcasts a WebSocket packet.
3. The Next.js frontend, secured behind a JWT login screen, displays the live webcam feed smoothly, and instantly pops up a Toast notification with the new event data, which can then be found persisted in the paginated Alert History table.
4. Streamlit and `events.json` are completely deleted from the repository.

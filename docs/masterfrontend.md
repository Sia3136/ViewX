# 1. Executive Summary

This is a deep product completeness and integration audit for **ExamGuard (DrishtiAI)**. 

The most critical finding of this audit is that **there is currently no backend, no database, and no API layer**. The application is entirely a "hackathon prototype" consisting of a local Python computer-vision pipeline that writes events to a `logs/events.json` file on the local disk, and a Streamlit frontend that synchronously reads that JSON file to render the UI.

The intended product architecture defined in `context.md` (React, FastAPI, PostgreSQL, LLMs) **has not yet been built**. Therefore, the upcoming redesign is not just a frontend visual overhaul, but a **complete full-stack system rewrite**, transitioning from a local script to a distributed web application.

---

# 2. What This Product Currently Is

Currently, the product operates as a standalone local script:
1. `main.py` initializes a `VideoPipeline` processing a local `.mp4` file or webcam.
2. The pipeline runs Ultralytics YOLO and YOLO-Pose.
3. Rule-based scripts (`src/behaviour/`) generate alerts.
4. Alerts are written to `logs/events.json` by `src/utils/logger.py`.
5. A Streamlit application (`src/dashboard/dashboard.py`) runs in a separate process, manually reading the JSON file to display charts and tables, and running its own instance of the CV pipeline to display a video feed.

---

# 3. What This Product Appears Intended to Become

Based on `context.md`, the final intended product is a scalable, cloud/edge hybrid system:

| Product Area | Intended Functionality | Current Frontend | Current Backend | Database Support | Status |
| ------------ | ---------------------- | ---------------- | --------------- | ---------------- | ------ |
| **Real-time Monitoring** | Ingest RTSP/CCTV streams. | Streamlit CV loop | Local Python script | None | 🟡 Partially complete |
| **Alert Engine** | Detect behaviors and flag them. | Streamlit UI | Local Python script | `events.json` | 🟡 Partially complete |
| **LLM Explainability** | Qwen2.5/Llama for alert reasoning. | None | None | None | 🔴 Missing |
| **Persistence** | Store logs and evidence. | Reads local JSON | Writes local JSON | **PostgreSQL (Intended)** | 🔴 Missing |
| **Dashboard** | Web UI for Invigilators. | Streamlit | None (No APIs) | None | 🟡 Partially complete |
| **Student Management** | Track anonymous IDs globally. | Basic counts | None | None | 🔴 Missing |
| **Role-based Auth** | Admin vs Invigilator access. | None | None | None | 🔴 Missing |

*(Note: Auth is inferred as a requirement for any production exam invigilation system).*

---

# 4. Current Frontend Architecture

* **Framework**: Streamlit (Python)
* **Routing**: Streamlit Multi-page App (`src/dashboard/pages/`)
* **State Management**: `st.session_state` (server-side, ephemeral)
* **Data Fetching**: Direct synchronous file system reads (`json.loads(Path.read_text())`).

---

# 5. Current Backend Architecture

* **Framework**: **NONE**. There is no FastAPI, Flask, Node, or Django app.
* **APIs**: **NONE**.
* **Services**: The "backend" logic is entirely encapsulated in the computer vision scripts (`src/pipeline`, `src/detection`, `src/behaviour`).

---

# 6. Current Database/Data Architecture

* **Database Engine**: **NONE**.
* **Storage Medium**: `logs/events.json` and `logs/events.csv`.
* **Schema**: Defined purely by a Python dictionary in `EventLogger` (`timestamp`, `student_id`, `behaviour_type`, `confidence`, `explanation`, `keypoints_snapshot`).

---

# 7. Complete Route Inventory

| Route | Purpose | Current State |
| ----- | ------- | ------------- |
| `/` (`dashboard.py`) | Main Dashboard & Live Video feed | **VERIFIED** |
| `/01_Live_Feeds` | Alert timeline and cards | **VERIFIED** |
| `/02_Students` | Basic aggregation of alerts by student ID | **VERIFIED** |
| `/03_Analytics` | Bar chart of behavior distribution | **VERIFIED** |
| `/04_Event_Log` | Raw unpaginated data table of all events | **VERIFIED** |
| `/05_Settings` | UI Toggles for Dark mode, Privacy, Camera | **VERIFIED** (Toggles are mocked) |

---

# 8. Complete Frontend Feature Inventory

| Feature | Route | Component(s) | User Action | Data Required | Backend Required | Current State |
| ------- | ----- | ------------ | ----------- | ------------- | ---------------- | ------------- |
| **Live CCTV Feed** | `/` | `cv2` + `st.image` | Click "Start" | Video Stream | RTSP/WebSocket | 🟡 UI thread blocking |
| **Recent Alerts** | `/` | Custom cards | View | Event JSON | API Endpoint | 🟡 Reads file |
| **Alert Timeline** | `/Live_Feeds` | `st.dataframe` | View | Event JSON | API Endpoint | 🟡 Reads file |
| **Student Aggregation** | `/Students` | `st.metric` | View | Event JSON | API Endpoint | 🟡 Reads file |
| **Analytics Charts** | `/Analytics` | `st.bar_chart` | View | Event JSON | API Endpoint | 🟡 Reads file |
| **Full Event Log** | `/Event_Log`| `st.dataframe` | Scroll | Event JSON | Paginated API | 🟡 Unpaginated |
| **System Settings** | `/Settings` | `st.toggle` | Toggle | Config persistence | Update Config API | 🧪 Mocked UI |

---

# 9. Complete Backend Capability Inventory

Because there is no HTTP Backend, these are "Capabilities" of the CV Pipeline scripts that need to be exposed via a future API.

| Backend Capability | Module | Purpose | DB/Data | Frontend Consumer | Status |
| ------------------ | ------ | ------- | ------- | ----------------- | ------ |
| **Person Tracking** | `src/tracking/` | Assign consistent IDs | None | Live Video Feed | 🟡 No API |
| **Pose Estimation** | `src/pose/` | Extract keypoints | None | Live Video Feed | 🟡 No API |
| **Behavior Rules** | `src/behaviour/`| Detect cheating rules | None | Alert Cards | 🟡 No API |
| **Event Logging** | `src/utils/logger.py`| Save events to disk | JSON/CSV | All Dashboard Pages | 🟡 Needs Postgres |

---

# 10. Frontend → Backend Integration Audit

* **No integrations exist.** The frontend reads a JSON file from disk. There are no HTTP requests (`fetch`, `axios`) in the entire codebase.

---

# 11. Backend → Frontend Integration Audit

* **No integrations exist.** The CV pipeline does not broadcast WebSockets or expose REST endpoints.

---

# 12. Empty/Broken/Missing Connections

### A. Missing API Connections (Entire Application)
The Streamlit app parses `logs/events.json` directly on every page load.
* **File → Function:** `src/dashboard/pages/01_Live_Feeds.py` → `load_events()`
* **Problem:** Direct file I/O instead of API call.
* **Required Backend Work:** Create `GET /api/alerts`.
* **Required Frontend Work:** Implement `fetch(/api/alerts)`.

### B. Broken Video Stream Connection
* **File → Function:** `src/dashboard/dashboard.py` → `LiveCCTVEngine.run()`
* **Problem:** Runs heavy OpenCV inference synchronously in the Streamlit UI thread. 
* **Evidence:** The UI is completely blocked while the video processes.
* **Required Backend Work:** Backend must run CV pipeline asynchronously and stream frames via WebRTC, MJPEG, or HLS.
* **Required Frontend Work:** Embed a proper video streaming player component.

### C. Mocked Settings UI
* **File → Function:** `src/dashboard/pages/05_Settings.py`
* **Problem:** Toggles like "Privacy Mode" and "Pose Tracking" have no variables attached to them and do not communicate with `config.yaml` or the CV pipeline.
* **Required Backend Work:** Create `PATCH /api/config`.
* **Required Frontend Work:** Connect UI toggles to the API.

---

# 13. Database → Backend → API → Frontend Trace

Currently **Broken at the Database layer**.

```text
Entity: Alert/Event

Database (PostgreSQL):
🔴 MISSING (Currently JSON file)

Backend (FastAPI):
🔴 MISSING

API (GET /events):
🔴 MISSING

Frontend (React/Next):
🔴 MISSING (Currently Streamlit reading JSON)
```

---

# 14. API Contract Mismatches

There are no APIs, but we can audit the **JSON Data Contract** that acts as the current pseudo-API.

**Current JSON Contract (`src/utils/logger.py`):**
```json
{
  "timestamp": "ISO8601 String",
  "student_id": "String (Anonymous ID)",
  "behaviour_type": "String",
  "confidence": "Float (0.0 to 1.0)",
  "explanation": "String",
  "keypoints_snapshot": "Array of Arrays (Optional/Null)"
}
```
**Mismatch Risk:**
If the JSON file gets too large, reading it synchronously will crash Streamlit. The future API contract *must* introduce `limit`, `offset`, and `pagination` parameters, which the frontend currently does not support.

---

# 15. User Workflow Audit

**Workflow: Invigilator reviews recent alerts**
```text
Entry point: Streamlit Dashboard
↓
Page: /Live_Feeds
↓
Action: User opens page
↓
API: 🔴 (Fails here: reads JSON file synchronously)
↓
Next page: UI renders entire history at once.
```
* **Failure Reason:** Missing API layer and missing pagination.

---

# 16. Dead Interaction Report

| UI Element | Location | Intended Action | Actual Action | Missing Dependency |
| ---------- | -------- | --------------- | ------------- | ------------------ |
| "Privacy Mode" Toggle | `05_Settings.py` | Turn on privacy mode | Does nothing | Configuration API |
| "Behaviour Alerts" Toggle | `05_Settings.py` | Disable alerts | Does nothing | Configuration API |
| "Pose Tracking" Toggle | `05_Settings.py` | Disable skeleton UI | Does nothing | Configuration API |
| "Video Source" Dropdown | `05_Settings.py` | Switch camera | Does nothing | Backend State/CV restart API |

---

# 17. Navigation Audit

| Navigation Item | Destination | Exists? | Correct? | Problem |
| --------------- | ----------- | ------- | -------- | ------- |
| Sidebar Links | `pages/*.py` | Yes | Yes | Streamlit multipage routing forces full page reloads, destroying UI state. |

---

# 18. Authentication/Authorization Audit

* **Login:** 🔴 Missing.
* **Role-based access:** 🔴 Missing.
* **API authorization:** 🔴 Missing (No APIs).

*Inferred Requirement: An exam monitoring system requires strict authentication to ensure only authorized proctors/invigilators can view student data.*

---

# 19. Forms & CRUD Audit

| Entity | Create | Read | Update | Delete | Frontend | Backend |
| ------ | ------ | ---- | ------ | ------ | -------- | ------- |
| **Alerts** | System | Yes | No | No | Streamlit | Python Script |
| **Settings**| No | No | No | No | 🔴 Mocked | 🔴 Missing |
| **Users** | No | No | No | No | 🔴 Missing| 🔴 Missing |

---

# 20. Mock/Hardcoded/Placeholder Audit

* **Location:** `src/dashboard/dashboard.py` (Line 47)
  * **What is mocked:** `VIDEO_PATH = Path("data/videos/sample.mp4")`
  * **Why it matters:** The system cannot ingest real RTSP streams dynamically.
* **Location:** `src/dashboard/pages/05_Settings.py`
  * **What is mocked:** All configuration toggles.
  * **Why it matters:** Users cannot actually control the system from the frontend.

---

# 21. Environment/Deployment Audit

* **Environment Variables (`.env`)**: **Missing**.
* There is a `config.yaml` for the CV pipeline, but the frontend does not read it.
* The system is fundamentally undeployable to the web in its current state because the UI requires access to the exact local file system where the CV pipeline writes its logs.

---

# 22. Design System Audit (Current Streamlit)

* **Colors**: Hardcoded Hex values in `dashboard.py`.
* **Breakpoints**: Streamlit defaults.
* **Components**: Non-customizable primitive Streamlit widgets.

---

# 23. Typography & Fonts

* **Fonts**: Default Streamlit system fonts. No custom branding.

---

# 24. Theme Audit

* **Implementation**: Toggling `st.session_state.dark_mode` triggers a page reload and injects a raw HTML `<style>` block.
* **Issue**: This is extremely brittle and causes flash-of-unstyled-content (FOUC).

---

# 25. UX Audit

* **Blocking Video:** Clicking "Start Monitoring" freezes the UI while OpenCV processes frames.
* **Manual Refresh:** New alerts do not appear unless the user explicitly clicks a "Refresh Dashboard" button (which triggers `st.rerun()`).

---

# 26. Responsive Audit

* Streamlit `st.columns()` stack vertically on mobile, but large `st.dataframe()` tables overflow horizontally with poor UX.

---

# 27. Accessibility Audit

* Native Streamlit inputs have basic ARIA, but the custom CSS injection negatively impacts contrast guarantees.

---

# 28. Performance Audit

* **Major Bottleneck:** Sync disk I/O on UI render.
* **Major Bottleneck:** Unpaginated data rendering.
* **Major Bottleneck:** Heavy CV inference on the main UI thread.

---

# 29. Security Audit

* **Sensitive Data:** Keypoints and alerts are saved in plaintext JSON.
* **API Exposure:** None (which is secure locally, but cannot be deployed).

---

# 30. What Is Missing From The Frontend

* A modern Web Framework (React/Next.js/Vite).
* Asynchronous data fetching (React Query/SWR).
* A proper design system (Tailwind + Shadcn/MUI).
* Video streaming player (WebRTC/HLS/MJPEG).
* Authentication UI (Login/Logout).
* Pagination for data tables.
* WebSockets for real-time alert toast notifications.

---

# 31. What Is Missing From The Backend

*(Based on `context.md` requirements)*
* FastAPI web server.
* PostgreSQL Database setup (SQLAlchemy/Prisma).
* REST API Endpoints (`/events`, `/students`, `/config`).
* WebSocket/SSE server to push real-time alerts to the frontend.
* Video streaming service to pipe camera feeds to the web frontend safely.
* Authentication/JWT middleware.

---

# 32. What Must Be Connected

* The Python Computer Vision pipeline (currently running locally) must be wrapped in a background worker (e.g., Celery) or run as a separate service that pushes results to the PostgreSQL database, rather than a local JSON file.

---

# 33. What Must Be Built

1. **Database Schema:** Tables for Users, Sessions, Cameras, Events, and Students.
2. **REST API:** To serve the database data to the frontend.
3. **Web Frontend:** A completely new React application replacing Streamlit.

---

# 34. What Must Be Preserved

* **The Business Logic:** The CV detection algorithms in `src/behaviour/` and `src/pose/` are the core IP and must remain intact.
* **The Data Schema:** The fields defined in `EventLogger` (`confidence`, `explanation`, `keypoints`) are perfectly suited for the future database schema.

---

# 35. Target Frontend Specification

### Global
* **Auth**: JWT based Login.
* **Layout**: Fixed sidebar navigation, top header with global status, toast notifications for high-priority alerts.
* **Real-time**: WebSocket connection for live UI updates without reloading.

### Target Pages
1. **Dashboard**: Video feed (WebRTC component) + Live scrolling alert feed.
2. **Alerts History**: Paginated, filterable, sortable data table of past events.
3. **Student Directory**: List of anonymous student IDs and their risk scores.
4. **Analytics**: Recharts/Chart.js graphs for behavioral trends over time.
5. **Settings**: Forms to update thresholds and camera sources (saving to API).

---

# 36. Target Site Map

```text
/login
/
├── /dashboard       (Live Monitoring)
├── /alerts          (Paginated Event Log)
├── /students        (Student Aggregation)
├── /analytics       (Charts)
└── /settings        (System Config)
```

---

# 37. Target Component Architecture

```text
components/
├── ui/              (Shadcn: Button, Card, Table, Badge, Dialog)
├── layout/          (Sidebar, Header, LayoutWrapper)
├── features/
│   ├── video/       (LiveStreamPlayer)
│   ├── alerts/      (AlertCard, AlertFeed, AlertBadge)
│   └── charts/      (DistributionChart, TimelineChart)
```

---

# 38. Required Backend/API Work

To support the new frontend, the backend team MUST build:

| Required Endpoint | Purpose | Priority |
| ----------------- | ------- | -------- |
| `POST /api/auth/login` | JWT Authentication | P0 |
| `GET /api/alerts` | Fetch paginated alerts | P0 |
| `GET /api/alerts/stream` | WebSocket for live alerts | P0 |
| `GET /api/stream/cam1` | MJPEG/WebRTC video stream | P0 |
| `GET /api/students` | Aggregated student stats | P1 |
| `GET /api/analytics` | Pre-aggregated chart data | P1 |
| `PATCH /api/settings` | Update system configuration | P2 |

---

# 39. Master Frontend–Backend Matrix

| Feature | Frontend UI | API Required | Backend Required | DB Required | Connected |
| ------- | ----------- | ------------ | ---------------- | ----------- | --------- |
| Auth | Login Page | `/api/auth` | JWT Service | Users Table | 🔴 Missing |
| Live Video | Video Player | `/api/stream`| Stream Handler | None | 🔴 Missing |
| Live Alerts | Alert Toast | `ws://alerts`| WS Broadcaster | Events Table| 🔴 Missing |
| Alert Log | Data Table | `/api/alerts`| DB Controller | Events Table| 🔴 Missing |
| Settings | Form UI | `/api/settings`| Config Manager | Config Table| 🔴 Missing |

---

# 40. Priority Matrix

| Priority | Issue | Type | Recommendation |
| -------- | ----- | ---- | -------------- |
| **P0** | **No Backend** | Architecture | Create a FastAPI app to serve as the bridge between the CV pipeline and the web frontend. |
| **P0** | **Database Migration** | Database | Replace `events.json` with PostgreSQL. |
| **P0** | **Frontend Rewrite** | Frontend | Replace Streamlit with Next.js/React. |
| **P1** | **Video Streaming** | Architecture | Implement a secure way to stream video to the browser without blocking the CV processing loop. |

---

# 41. Recommended Redesign Roadmap

* **Phase 1 (Backend Foundation):** Setup PostgreSQL. Rewrite `logger.py` to write to the DB instead of JSON.
* **Phase 2 (API Layer):** Build FastAPI endpoints for CRUD operations on the alerts database.
* **Phase 3 (Frontend Foundation):** Setup Next.js + Tailwind + Shadcn UI. Build the layout and routing.
* **Phase 4 (Data Integration):** Connect the frontend to the REST API (Dashboard, Tables, Analytics).
* **Phase 5 (Real-Time):** Implement WebSockets for live alerts and WebRTC/MJPEG for the live CCTV feed.
* **Phase 6 (Auth & Polish):** Add login screens, loading states, error boundaries, and final UI polish.

---

# 42. Final "Before We Redesign" Checklist

- [ ] Ensure the backend team understands they must build a FastAPI layer; the frontend cannot proceed to data-binding without it.
- [ ] Agree on the exact JSON schema for the `/api/alerts` REST endpoint.
- [ ] Decide on the video streaming protocol (MJPEG is easiest to implement quickly, WebRTC is best for latency).
- [ ] Determine if the LLM feature (`context.md`) is in-scope for this phase, as it requires completely new backend services.

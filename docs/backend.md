# 1. Backend Executive Summary

This is the deep backend and database audit for **ExamGuard (DrishtiAI)**.

The most critical finding of this audit is that **there is currently no backend, no database, and no API layer in this repository.** 

While the project documentation (`context.md`) specifies a FastAPI backend with a PostgreSQL database, the actual codebase consists entirely of a local Python Computer Vision script that writes to a `logs/events.json` file, which is then read synchronously by a local Streamlit dashboard. 

Therefore, this audit serves primarily as a **Gap Analysis and Target Specification** for building the backend from scratch to support the planned frontend redesign.

---

# 2. Backend Architecture

* **Framework:** **🔴 MISSING** (Intended: FastAPI)
* **Runtime:** Python
* **Database:** **🔴 MISSING** (Intended: PostgreSQL)
* **Storage:** Local Disk (`logs/events.json`, `logs/events.csv`)
* **WebSockets:** **🔴 MISSING**
* **Authentication:** **🔴 MISSING**

**Current Architecture:**
```text
CV Pipeline -> EventLogger (Python Class) -> events.json (Local Disk)
```

**Required Architecture:**
```text
CV Worker -> gRPC/Redis Queue -> FastAPI Server -> PostgreSQL
                                        ↓
                                  WebSockets/REST
                                        ↓
                                  Web Frontend
```

---

# 3. Complete API Inventory

| Method | Endpoint | Controller | Auth | DB | Frontend Consumer | Status |
| ------ | -------- | ---------- | ---- | -- | ----------------- | ------ |
| ALL | N/A | N/A | N/A | N/A | N/A | **🔴 MISSING** |

> **VERIFIED:** There are 0 HTTP endpoints implemented in this repository.

---

# 4. API Contracts

> **VERIFIED:** No API contracts exist. 

The closest equivalent is the JSON data contract written by `src/utils/logger.py`:
```json
{
  "timestamp": "2026-08-21T21:40:00.000Z",
  "student_id": "student_001",
  "behaviour_type": "repeated_head_turning",
  "confidence": 0.86,
  "explanation": "Student changed head orientation repeatedly.",
  "keypoints_snapshot": [...]
}
```
*Mismatch Risk:* The frontend currently reads the entire JSON file into memory. A future API must introduce pagination (`limit`, `offset`) to prevent crashing the browser.

---

# 5. Database Architecture

> **VERIFIED:** No database exists. The system relies on local `.json` and `.csv` files.

**Inferred Target Entity Relationship (Based on current data):**
* **`User`**: (Invigilator / Admin) - For login and authorization.
* **`Student`**: (Anonymized ID) - Tracks historical risk scores.
* **`Event`**: (Alerts) - Belongs to a Student, contains behavior type, confidence, and timestamps.
* **`Configuration`**: System-wide settings (thresholds, privacy mode).

---

# 6. Migration/Schema Audit

> **VERIFIED:** No schemas or migrations exist (no Alembic, Prisma, or raw SQL files).

---

# 7. Entity/CRUD Audit

| Entity | Create | Read | Update | Delete | API | DB | Complete? |
| ------ | ------ | ---- | ------ | ------ | --- | -- | --------- |
| **Events** | Python Script | Streamlit | No | No | 🔴 No | 🔴 No | 🔴 Missing |
| **Users** | No | No | No | No | 🔴 No | 🔴 No | 🔴 Missing |
| **Settings**| Mocked UI | Mocked UI | No | No | 🔴 No | 🔴 No | 🔴 Missing |

---

# 8. Authentication Audit

> **VERIFIED:** Authentication is completely absent.

**Required Work:** Implement JWT-based authentication in the new backend to ensure only authorized invigilators can view CCTV feeds and student alerts.

---

# 9. Authorization Audit

> **VERIFIED:** Authorization is completely absent.

**Required Work:** Implement Role-Based Access Control (RBAC). E.g., `Admin` can change system configuration/thresholds; `Invigilator` can only view alerts.

---

# 10. Validation Audit

> **VERIFIED:** Request validation is completely absent.

**Required Work:** Implement Pydantic models (if using FastAPI) to validate incoming event payloads from the CV pipeline and configuration updates from the frontend.

---

# 11. Business Logic Audit

Currently, business logic is split:
* **CV Rules:** Bypassed in `behaviour.py` and hardcoded inside the UI render loop in `live_cctv.py`.
* **Data Processing:** Handled entirely by the Streamlit frontend (e.g., grouping events by student ID, calculating high/medium/low severity based on confidence).

**Required Work:** The frontend should NOT do data aggregation. The backend must calculate event severity, student summaries, and time-series analytics, serving clean, ready-to-render data to the frontend.

---

# 12. Error Handling Audit

> **VERIFIED:** No HTTP error handling exists.

---

# 13. Empty/Stub/Placeholder Backend Report

The entire backend is effectively a stub. The settings UI (`05_Settings.py`) contains toggles ("Privacy Mode", "Pose Tracking") that do absolutely nothing because there is no configuration API to receive the updates.

---

# 14. Frontend ↔ Backend Connection Audit

### A. Backend exists → frontend not connected
None.

### B. Frontend expects → backend missing
* **Live Video Feed:** Frontend expects a stream, but currently runs OpenCV locally. Needs an MJPEG/WebRTC streaming endpoint.
* **Alert Feed:** Frontend expects real-time alerts. Needs a WebSocket endpoint.
* **Settings Update:** Frontend expects to save settings. Needs `PATCH /api/config`.

### C. Both exist → broken connection
None.

### D. Neither exists → potentially required
* **Authentication (`/api/auth/login`)**: Required for production security.
* **Student Directory (`/api/students`)**: Required to view historical risk profiles of specific IDs.

---

# 15. Missing Backend Functionality

* Web Server (FastAPI).
* Database (PostgreSQL).
* Video Streaming Service.
* WebSocket Event Broadcaster.
* Auth/JWT Service.

---

# 16. Unused Backend Functionality

N/A.

---

# 17. External Integrations

None currently exist.
*Inferred:* The `context.md` mentions LLMs (Qwen2.5/Llama) for alert explanations. This external API integration is currently completely absent.

---

# 18. ML/Backend Integration

Currently, the ML pipeline runs *inside* the UI thread.
**Required Work:** The ML pipeline must be decoupled into a separate background worker process. The backend must provide an internal API or Message Queue (Redis/RabbitMQ) for the ML worker to push events into the database.

---

# 19. Background Jobs / Cron

> **VERIFIED:** Missing. 

**Required Work:** A cleanup cron job will be needed to archive or delete old video streams and event logs to prevent the server disk from filling up.

---

# 20. WebSockets / Real-Time

> **VERIFIED:** Missing.

**Required Work:** Critical for the redesign. The frontend cannot manually poll or refresh to see new alerts. The backend must broadcast new events via WebSockets.

---

# 21. Caching

> **VERIFIED:** Missing.

---

# 22. Search / Filtering / Pagination

> **VERIFIED:** Missing.

The current Streamlit UI loads the entire `events.json` file into an `st.dataframe`. This will crash in production. The backend MUST implement `?page=1&limit=50` and filtering (`?severity=high`) on the events endpoint.

---

# 23. Security Audit

* **CORS:** Missing.
* **Rate Limiting:** Missing.
* **Secrets Management:** Missing (No `.env` file used for DB passwords or JWT secrets).

---

# 24. Environment Configuration

> **VERIFIED:** The project relies on a static `config.yaml` with hardcoded local paths (`data/videos/sample.mp4`). There are no `.env` files for production deployment configurations.

---

# 25. Deployment Readiness

> **VERIFIED:** The backend is 0% deployment-ready.

There is no `Dockerfile`, no `docker-compose.yml`, no production server (like Uvicorn/Gunicorn), and no database migration scripts. It only runs locally on a developer machine.

---

# 26. Performance

Currently, the system experiences severe UI blocking because OpenCV and Streamlit share the same thread. A proper backend architecture with asynchronous workers is required to fix this.

---

# 27. Observability

> **VERIFIED:** Missing. There is no structured API request logging, Prometheus metrics, or Sentry integration.

---

# 28. Target Backend Specification

To support the future redesigned frontend, the backend team MUST build the following contracts:

**1. Authentication**
* `POST /api/auth/login`: Accepts username/password, returns JWT.

**2. Video Streaming**
* `GET /api/stream/live`: Returns an MJPEG stream or WebRTC signaling data for the CCTV feed.

**3. Event Logs**
* `GET /api/events`: Returns paginated alerts.
  * *Query Params:* `page`, `limit`, `severity`, `student_id`.
* `WS /api/events/ws`: WebSocket for pushing real-time alerts to the UI.

**4. Analytics**
* `GET /api/analytics/summary`: Returns pre-aggregated stats (total alerts, severity counts) for dashboard widgets.
* `GET /api/students`: Returns a list of unique student IDs and their aggregate risk scores.

**5. System Configuration**
* `GET /api/config`: Returns current system thresholds.
* `PATCH /api/config`: Updates thresholds and toggles privacy mode.

---

# 29. Master Backend Gap Matrix

| Feature | DB | Service | API | Auth | Frontend Consumer | Status | Required Work | Priority |
| ------- | -- | ------- | --- | ---- | ----------------- | ------ | ------------- | -------- |
| **Auth** | Users Table | JWT logic | `POST /login` | N/A | Login Page | 🔴 Missing | Build entirely | P0 |
| **Video** | None | OpenCV async | `GET /stream` | JWT | Dashboard | 🔴 Missing | Decouple CV loop | P0 |
| **Live Alerts**| Events Table| WS Manager | `WS /events` | JWT | Alert Feed | 🔴 Missing | Build WS server | P0 |
| **Event History**| Events Table| Pagination | `GET /events` | JWT | Data Table | 🔴 Missing | Build REST endpoint | P1 |
| **Analytics** | Events Table| Aggregation | `GET /analytics`| JWT | Charts | 🔴 Missing | Build REST endpoint | P1 |
| **Settings** | Config Table| Config logic | `PATCH /config` | JWT | Settings UI | 🔴 Missing | Build REST endpoint | P2 |

---

# 30. Backend Implementation Roadmap

**Phase 1: Database & ORM Foundation**
* Setup PostgreSQL and SQLAlchemy (or Prisma/SQLModel).
* Create migrations for `Users`, `Events`, and `Config` tables.

**Phase 2: API Scaffolding & Auth**
* Initialize FastAPI.
* Implement JWT Authentication and Role-Based middleware.

**Phase 3: The ML Bridge**
* Refactor the local Python CV script to push its JSON output into the PostgreSQL database.
* Move the CV script out of the main web thread into a background worker.

**Phase 4: Core REST Endpoints**
* Build `GET /api/events` with pagination and filtering.
* Build `GET /api/analytics` for dashboard stats.

**Phase 5: Real-Time Services**
* Implement WebSockets to broadcast new events instantly.
* Implement an MJPEG or WebRTC streaming endpoint to serve the video feed to the browser securely.

---

# 31. Final Backend Completion Checklist

- [ ] Choose and initialize the backend framework (FastAPI recommended).
- [ ] Set up PostgreSQL and apply initial schemas.
- [ ] Create `.env` management for DB credentials and JWT secrets.
- [ ] Separate the CV pipeline from the UI loop and connect it to the database.
- [ ] Implement the REST APIs defined in the Target Specification.
- [ ] Implement WebSockets for real-time alert streaming.
- [ ] Provide Postman/Swagger documentation to the frontend team for integration.
# Drishti AI — Professional Technical Gap Analysis & Implementation Roadmap

---

## PART 1 — PROBLEM STATEMENT REQUIREMENTS MATRIX

| Requirement | Required by PS? | Current Implementation | Status | Evidence | Gap |
|---|---|---|---|---|---|
| Multi-person detection from live video | ✅ | YOLOv8-pose in `worker.py` | ✅ Complete | Doc2 §6 | None |
| Multi-person tracking with stable IDs | ✅ | ByteTrack via Ultralytics | ✅ Complete | Doc2 §7 | Minor: no custom occlusion recovery |
| Pose estimation (17 keypoints) | ✅ | `yolov8s-pose.pt`, 17 keypoints | ✅ Complete | Doc2 §8 | MediaPipe not used (acceptable drift) |
| Head orientation detection | ✅ | Yaw via nose/shoulder delta in `pose.py` | 🟡 Partial | Doc2 §11 | Pitch missing; yaw only |
| Body/shoulder rotation | ✅ | `arctan2` in `worker.py` | ✅ Complete | Doc2 §11 | Hip rotation missing |
| Hand movement detection | ✅ | Speed via `norm()` in `worker.py` | 🟡 Partial | Doc2 §11 | Trajectory not tracked |
| Sideward glances behavior | ✅ | `behaviour.py`, rolling 10s window | ✅ Complete | Doc2 §12 | Hardcoded thresholds |
| Excessive head turning behavior | ✅ | `behaviour.py`, 15s window | ✅ Complete | Doc2 §12 | Hardcoded thresholds |
| Body rotation toward neighbor | ✅ | `behaviour.py`, sustained >15° for >3s | ✅ Complete | Doc2 §12 | Hardcoded thresholds |
| Unusual hand movements | ✅ | `behaviour.py`, speed + shoulder width | ✅ Complete | Doc2 §12 | Hardcoded thresholds |
| Non-verbal communication detection | ✅ | Hand-to-nose distance in `behaviour.py` | ✅ Complete | Doc2 §12 | Proxy only; limited |
| Object detection (phone, paper/chit) | ✅ | `object_detector.py` exists | 🔴 Missing | Doc2 §9 | Exists but **never imported by `worker.py`** |
| Student-object spatial association | ✅ | Not implemented | ❌ Broken | Doc2 §10 | Code orphaned; association logic absent |
| False-positive filtering | ✅ | `_is_looking_down`, `_is_stretching`, `_is_writing` | 🟡 Partial | Doc2 §14 | Rule-based only; no learned suppression |
| Confidence scoring | ✅ | Heuristic ratio (e.g., glance_count/required) | 🟡 Partial | Doc2 §15 | Meaningful but not model-derived |
| Explainable alerts (natural language) | ✅ | Hardcoded string templates | 🟡 Partial | Doc2 §15 | No LLM; not truly explainable |
| Real-time alert generation | ✅ | Redis pub/sub → FastAPI WS → Next.js | ✅ Complete | Doc2 §18 | WS unauthenticated |
| Behavioral risk score | ✅ (extension goal) | Not implemented | 🔴 Missing | Doc2 §40 | No composite risk scoring |
| Event logging to persistent storage | ✅ | PostgreSQL via direct SQLAlchemy in `worker.py` | ✅ Complete | Doc2 §8 | Sync write causes frame drops |
| Analytics for invigilator review | ✅ | Shallow `/api/analytics/summary` | 🟡 Partial | Doc1 §7 | Missing student count, avg confidence |
| Live video streaming | ✅ | MJPEG on port 5000 | ✅ Complete | Doc2 §19 | Thread-lock bottleneck; single viewer safe |
| Frontend dashboard | ✅ | Next.js App Router | 🟡 Partial | Doc2 §20 | Analytics/Students pages mocked |
| Privacy-conscious (no face recognition) | ✅ | Tracking IDs only (`student_001`) | ✅ Complete | Doc2 §7 | Acceptable |
| Authentication / role management | ✅ | JWT + bcrypt + RoleEnum | ✅ Complete | Doc2 §27 | Hardcoded JWT secret |
| Configurable thresholds via settings | ✅ | Settings UI + DB, but ML ignores it | ❌ Broken | Doc2 §25 | Settings are a placebo |
| Historical event log for review | ✅ | `/api/events/` with pagination | ✅ Complete | Doc1 §7 | Working |
| Students overview | ✅ | Client-side aggregation of 500 events | ⚠️ | Doc2 §20 | No backend `/api/students/` endpoint |
| CSV/Evidence export | ✅ (implied) | `logger.py` was dropped in migration | 🔴 Missing | Doc2 §41 | Lost during Streamlit → Next.js |
| Testing | ✅ | Tests exist but test orphaned modules | ⚠️ | Doc2 §31 | Tests cover `object_detector.py`, not the live pipeline |
| Multi-camera support | ✅ (implied) | Single hardcoded video file | 🔴 Missing | Doc2 §30 | `VIDEO_PATH` hardcoded |

---

## PART 2 — IS THE P.S. APPLICATION ACTUALLY PRESENT?

**Verdict: PARTIALLY**

The system delivers a real, functional pipeline from pose inference to real-time browser alerts. A student's head turn genuinely produces a database event and a WebSocket notification in the UI. That core loop works.

However, the problem statement's most differentiating requirements are either absent or broken:

- **Object detection (phones/paper):** The code exists in `object_detector.py` but is never called by `worker.py`. This is not a minor gap — it is an explicit requirement.
- **Student-object spatial association:** Entirely absent.
- **Configurable thresholds:** The Settings UI writes to the DB but the ML worker never reads it. The settings system is non-functional as a control mechanism.
- **Explainable AI:** The PS requires "interpretable explanations." The current system produces rule-templated strings, which technically satisfy a literal reading of this, but the hackathon extension goal of LLM-based natural language summaries is absent.
- **Behavioral risk score:** Not implemented.
- **CSV/evidence export:** Lost during migration.

The system is impressive as a pose-tracking alert pipeline. It does not yet satisfy the full problem statement.

---

## PART 3 — CURRENT IMPLEMENTATION AUDIT (ML/CV)

| Subsystem | What Exists | Where | Connected to Pipeline? | Functional? | Gap |
|---|---|---|---|---|---|
| Video input | Hardcoded `.mkv` file path | `worker.py:VIDEO_PATH` | Yes | Yes | Not configurable; camera source not supported |
| Frame processing | OpenCV `VideoCapture` loop | `worker.py` | Yes | Yes | Synchronous; DB write blocks loop |
| YOLO model | `yolov8s-pose.pt` | Root directory | Yes | Yes | Correct for pose; not YOLOv11 as doc claims |
| Person detection | Via YOLO pose | `worker.py` | Yes | Yes | Working |
| ByteTrack tracking | `bytetrack.yaml` via Ultralytics | `worker.py:155` | Yes | Yes | Working |
| Student IDs | Formatted as `student_001` | `worker.py:182` | Yes | Yes | Working |
| Pose keypoints | 17 2D keypoints extracted | `src/pose/pose.py` | Yes | Yes | Missing keypoints fall back to `(0,0)` |
| Temporal buffers | Rolling frame histories | `behaviour.py` | Yes | Yes | Working |
| Head yaw | Nose–shoulder delta | `pose.py` | Yes | Yes | Functional proxy |
| Head pitch | Not implemented | — | No | No | Missing entirely |
| Shoulder rotation | `arctan2(dy, dx)` | `worker.py` | Yes | Yes | Working |
| Hip rotation | Not implemented | — | No | No | Missing |
| Hand speed | `norm(current - prev)` | `worker.py` | Yes | Yes | Working |
| Hand trajectory | Not implemented | — | No | No | Missing |
| Object detection (phone/paper) | `object_detector.py` (classes: `cell phone`, `book`) | `src/detection/` | **No** | Untested in pipeline | **Orphaned — never called** |
| Student-object association | Not implemented | — | No | No | Missing entirely |
| Spatial reasoning | Not implemented | — | No | No | Missing entirely |
| Behavior engine | 5 behaviors, rolling windows | `src/behaviour/behaviour.py` | Yes | Yes | Thresholds hardcoded, not DB-driven |
| False-positive filters | `_is_looking_down`, `_is_stretching`, `_is_writing` | `behaviour.py` | Yes | Yes | Rule-based only |
| Confidence scoring | Ratio heuristics | `behaviour.py` | Yes | Yes | Not YOLO-derived; meaningful but shallow |
| Alert generation | Dict → Redis pub/sub | `worker.py` | Yes | Yes | Working |
| Explanation generation | Hardcoded f-strings | `behaviour.py` | Yes | Partial | No LLM |
| FPS measurement | Read at startup | `worker.py` | No | No | Never sent to dashboard |
| Occlusion handling | Keypoint `(0,0)` fallback | `pose.py`, `behaviour.py` | Yes | Partial | No re-identification on track loss |
| MJPEG streaming | `StreamingResponse` on port 5000 | `worker.py` | Yes | Yes (1 client) | Thread-lock; fails under concurrent load |

---

## PART 4 — BEHAVIOUR DETECTION AUDIT

| Behaviour | Required | Implemented | Detection Logic | Temporal Logic | FP Filtering | Confidence | Explanation | Tested in Pipeline | Status |
|---|---|---|---|---|---|---|---|---|---|
| Sideward glances | ✅ | ✅ | Yaw offset > threshold | >3 in 10s window | `_is_looking_down` suppresses | Glance ratio | Template string | ❌ No pipeline test | 🟡 |
| Excessive head turning | ✅ | ✅ | Orientation change count | >5 in 15s window | Partial | Change ratio | Template string | ❌ No pipeline test | 🟡 |
| Body rotation (toward neighbor) | ✅ | ✅ | Shoulder angle `arctan2` | Sustained >15° for >3s | `_is_stretching` | Duration ratio | Template string | ❌ No pipeline test | 🟡 |
| Unusual hand movement | ✅ | ✅ | Hand speed / shoulder width | Sustained high >3s | `_is_stretching` suppresses | Speed ratio | Template string | ❌ No pipeline test | 🟡 |
| Non-verbal communication | ✅ | ✅ | Hand-to-nose distance | Sustained proximity >2s | None specific | Duration ratio | Template string | ❌ No pipeline test | 🟡 |
| Phone use detection | ✅ | ❌ | Orphaned in `object_detector.py` | None | None | None | None | ❌ | 🔴 |
| Paper/chit detection | ✅ | ❌ | Orphaned in `object_detector.py` | None | None | None | None | ❌ | 🔴 |
| Behavioral risk score | ✅ (extension) | ❌ | Not implemented | None | None | None | None | ❌ | 🔴 |
| Head pitch (looking down at hidden material) | 🟡 | ❌ | Not implemented | None | None | None | None | ❌ | 🔴 |
| Hip rotation | 🟡 | ❌ | Not implemented | None | None | None | None | ❌ | 🔴 |

**Critical observations:**
- All 5 implemented behaviors use hardcoded thresholds in `BehaviorThresholds`. These constants are never read from the settings DB, making the Settings page a UI illusion.
- Tests in `tests/` cover `object_detector.py` — a module that never runs in production. The behaviors that actually run (`behaviour.py`) have zero automated test coverage.
- No pipeline-level test verifies that a behavior alert actually reaches the frontend.

---

## PART 5 — BACKEND AUDIT

### Endpoint Table

| Endpoint | Exists | Functional | Auth | Frontend Connected | ML Connected | Data Real | Issues |
|---|---|---|---|---|---|---|---|
| `GET /api/health` | ✅ | ✅ | None | ✅ | No | Yes | None |
| `POST /api/auth/login` | ✅ | ✅ | None | ✅ | No | Yes | JWT secret hardcoded |
| `POST /api/auth/register` | ✅ | ✅ | None | ✅ | No | Yes | Forces INVIGILATOR; admin requires seed script |
| `GET /api/events/` | ✅ | ✅ | JWT | ✅ | Indirect (via DB) | Yes | Sync ML write is race-prone |
| `GET /api/analytics/summary` | ✅ | 🟡 | JWT | ✅ | Indirect | Partial | Missing `total_students`, `average_confidence` |
| `GET /api/settings/` | ✅ | ✅ | JWT | ✅ | **No** | Yes | ML worker ignores this endpoint entirely |
| `PATCH /api/settings/` | ✅ | ✅ | JWT (Admin) | ✅ | **No** | Yes | DB updated; ML never reads it |
| `WS /api/ws/alerts` | ✅ | ✅ | **None** | ✅ | Yes (via Redis) | Yes | No token validation — anyone can subscribe |
| `GET /api/students/` | ❌ | ❌ | — | ❌ | — | — | Does not exist; frontend aggregates client-side |
| ML → Backend POST (internal) | ❌ | ❌ | — | — | — | — | ML writes directly to DB, bypassing FastAPI entirely |

### Key Backend Issues

- `JWT_SECRET` is hardcoded as `"dummy_secret_for_hackathon"` in `src/core/security.py`. This is a P0 secret leak.
- CORS is `*` across the board — unsafe for any non-localhost deployment.
- `/api/analytics/summary` returns only behavior-type counts. The frontend degrades `total_students` and `average_confidence` to "Unavailable" because those fields are never computed.
- The ML worker has zero connection to the FastAPI layer. It maintains its own SQLAlchemy session. This means settings changes via API have zero effect on ML behavior, and ML events bypass any middleware FastAPI might apply.
- No `/api/students/` endpoint exists. The frontend constructs student summaries by fetching the last 500 events and aggregating them in the browser — fragile, slow, and incorrect at scale.

---

## PART 6 — DATABASE AUDIT

| Table | Exists | Migration Present | Used | Issues |
|---|---|---|---|---|
| `users` | ✅ | ✅ | ✅ | Admin only via seed script |
| `students` | ✅ | ✅ | 🟡 | ML writes student IDs but no dedicated student profile aggregation |
| `events` | ✅ | ✅ | ✅ | `keypoints` stored as JSONB; sync write from ML |
| `settings` | ✅ | ✅ | 🟡 | Persisted, but ML worker never reads it |

**Observations:**
- The schema is well-designed and migrations match models precisely.
- `Event.keypoints` as JSONB is appropriate and future-proof for the LLM phase.
- Historical analytics are theoretically possible from the schema (events have behavior type, timestamp, confidence, student ID) but the API doesn't expose aggregate queries.
- No `risk_score` column exists on `students` or `events` — the extension goal behavioral risk score has no persistence path.
- Cannot be verified from the provided documents whether there is an index on `events.student_id` or `events.behaviour_type`, which would matter for analytics query performance.

---

## PART 7 — FRONTEND AUDIT

| Route | Exists | Real Data | Backend Connected | Mocked | Auth | Issues |
|---|---|---|---|---|---|---|
| `/sign-in` | ✅ | ✅ | ✅ | No | N/A | Working |
| `/sign-up` | ✅ | ✅ | ✅ | No | N/A | Forces INVIGILATOR role |
| `/dashboard` | ✅ | Partial | ✅ | Partial | ✅ | Missing ML metrics (FPS, active students) |
| `/dashboard/alerts` | ✅ | ✅ | ✅ (WS) | No | ✅ | WS unauthenticated server-side |
| `/dashboard/events` | ✅ | ✅ | ✅ | No | ✅ | Working; pagination via API |
| `/dashboard/analytics` | ✅ | Partial | ✅ | `total_students`, `avg_confidence` mocked | ✅ | Backend doesn't return needed fields |
| `/dashboard/students` | ✅ | Partial | ❌ | Entire page is client-side aggregation | ✅ | No `/api/students/` exists |
| `/dashboard/settings` | ✅ | ✅ | ✅ | No | ✅ (Admin) | Settings saved to DB but ML ignores them |
| Live video (MJPEG) | ✅ | ✅ | ML Worker `:5000` | No | None | Direct browser→ML connection; no auth |

### Frontend ↔ Backend Mismatches

- `GET /api/analytics/summary` → Frontend expects `total_students` (integer) and `average_confidence` (float); backend never returns these fields. Frontend silently degrades.
- `/dashboard/students` → Frontend expects `/api/students/` concept; endpoint does not exist. Frontend fetches `/api/events/?limit=500` and aggregates by student ID in the browser. This is fragile: at >500 events, the oldest students disappear from the view.
- Settings `PATCH /api/settings/` → Frontend correctly updates settings to DB, but there is no mechanism for the ML worker to read updated settings. The UI gives users a false sense of control.
- MJPEG stream at `http://localhost:5000/video_feed` → Hardcoded URL. Will not work in any non-localhost deployment (Docker, staging, production).

---

## PART 8 — STREAMLIT → NEXT.JS MIGRATION

| Old Streamlit Feature | Next.js Replacement | Functional Parity? | Missing Functionality | Priority |
|---|---|---|---|---|
| Live video display | MJPEG via `<img>` tag | ✅ | None notable | — |
| Real-time alerts display | WebSocket `/api/ws/alerts` | ✅ | WS has no auth | Low |
| Event logging via `logger.py` → CSV | Dropped entirely | ❌ No | CSV export gone | Medium |
| FPS tracker / system metrics | Not migrated | ❌ No | FPS never sent to dashboard | Medium |
| Settings affecting ML (direct variable access) | Settings API → DB (ML ignores) | ❌ No | Settings are now a placebo | High |
| Student summary view | Client-side 500-event aggregation | ⚠️ Degraded | No real backend aggregation | High |
| Analytics charts | Recharts BarChart with real behavior counts | 🟡 Partial | Student/confidence metrics missing | Medium |

The migration successfully rebuilt the visual shell but lost two operationally important features: CSV export and settings-to-ML integration. The settings loss is the most impactful because in the Streamlit version, settings were presumably in-process variables that affected the ML loop directly.

---

## PART 9 — REAL-TIME PIPELINE AUDIT

### Alert Path

```
ML Worker (worker.py)
  → BehaviourEngine (behaviour.py) — ✅ Working
  → PostgreSQL direct write (sync, blocking) — ✅ Working, ⚠️ Frame-drop risk
  → Redis publish to 'alerts' channel — ✅ Working
  → FastAPI asyncio listener (websockets.py) — ✅ Working
  → WebSocket broadcast to all connected clients — ✅ Working, ❌ No auth
  → Next.js /dashboard/alerts — ✅ Working, ✅ Auto-reconnects
```

**Verdict: End-to-end alert path is functional.** A real head-turn alert does reach the browser. The two failure modes are: (1) synchronous DB write causing frame drops under PostgreSQL latency, and (2) the WebSocket endpoint having no authentication, meaning any client anywhere can subscribe to exam alerts.

### Video Stream Path

```
ML Worker MJPEG server (FastAPI on :5000)
  → StreamingResponse, thread-locked frame buffer — ✅ Working
  → Browser <img src="http://localhost:5000/video_feed"> — ✅ Working (1 client)
  → Dashboard live video component — ✅ Working
```

**Verdict: Functional for single viewer. Thread-lock bottleneck makes multi-viewer unsafe.** URL is hardcoded to `localhost:5000`, which breaks in any deployed environment.

---

## PART 10 — ENVIRONMENT VARIABLES, SECRETS & HARDCODED VALUES

| Item | Location | Current Value | Should Be Env? | Risk | Action |
|---|---|---|---|---|---|
| `DB_URL` (full with credentials) | `ml_worker/worker.py` | `examguard_user:supersecretpassword@localhost:5432/...` | ✅ Yes | 🔴 P0 — credential leak in source | Move to `.env`, read via `os.environ` |
| `JWT_SECRET` | `backend/src/core/security.py` | `"dummy_secret_for_hackathon"` | ✅ Yes | 🔴 P0 — trivially forgeable tokens | Move to `.env` |
| `VIDEO_PATH` | `ml_worker/worker.py` | `"input videos/04.CCTV Candidate Talking.mkv"` | ✅ Yes | 🟡 P1 — non-functional on other machines | Move to `.env` or CLI arg |
| `MODEL_NAME` | `ml_worker/worker.py` | `"yolov8s-pose.pt"` | ✅ Yes | 🟡 P2 — configuration, not secret | Move to `.env` |
| `CONFIDENCE` | `ml_worker/worker.py:34` | `0.49` | ✅ Yes | 🟡 P2 — should be settings-driven | Read from settings DB |
| `BehaviorThresholds` (all) | `behaviour.py` | Various constants | ✅ Yes | 🟡 P2 — not configurable via UI | Read from settings DB |
| `MJPEG URL` | Frontend component | `http://localhost:5000/video_feed` | ✅ Yes | 🟡 P1 — breaks in deployment | Read from `NEXT_PUBLIC_WORKER_URL` env |
| CORS `*` | `backend/main.py` | `"*"` | ✅ Yes | 🟡 P2 — insecure in production | Restrict to known origins |
| DB credentials in `docker-compose.yml` | `docker-compose.yml` | Present | ✅ Yes | 🟡 P2 — should use `.env` file | Externalize to `.env` |
| Admin seed script | `backend/scripts/seed.py` | Likely hardcoded default password | Cannot be verified | 🟡 P1 — if default password | Verify and externalize |
| Redis URL | `backend/main.py` or config | `redis:6379` | ✅ Yes | 🟢 Safe for Docker | Acceptable as Docker default; externalize for prod |

---

## PART 11 — SECURITY AUDIT

| Issue | Location | Classification | Description |
|---|---|---|---|
| Hardcoded `JWT_SECRET = "dummy_secret_for_hackathon"` | `security.py` | **P0** | Anyone who reads the source can forge admin tokens |
| Hardcoded DB credentials in ML worker source | `worker.py` | **P0** | `examguard_user:supersecretpassword` committed to code |
| WebSocket `/api/ws/alerts` has no auth | `websockets.py` | **P1** | Any client can subscribe to real-time exam alerts — including student devices on the same network |
| CORS `*` | `backend/main.py` | **P1** | Enables cross-site requests from any origin; critical if deployed beyond localhost |
| Admin registration bypasses API | `backend/scripts/seed.py` | **P2** | Acceptable if seed script is secured; risky if default credentials are weak |
| ML worker bypasses FastAPI auth entirely | `worker.py` | **P2** | Direct DB writes mean no authorization layer around event creation |
| MJPEG stream on port 5000 has no auth | `worker.py` | **P2** | Live exam video is accessible to anyone who can reach port 5000 |
| `localStorage` for JWT storage | Frontend `AuthContext.tsx` | **P2** | Vulnerable to XSS; `httpOnly` cookie preferred |
| No rate limiting on auth endpoints | `backend/` | **P3** | Brute-force login possible |
| Student tracking IDs in event logs | `events` table | **P3** | Privacy: IDs are pseudonymous but events with keypoints could theoretically re-identify students |

---

## PART 12 — CONFIGURATION & HARDWARE/ML ENVIRONMENT

### Required for Frontend
- Node.js (version unspecified; Next.js 16 implies Node 18+)
- `npm install`
- `NEXT_PUBLIC_API_URL` (currently hardcoded to `localhost:8000`)
- `NEXT_PUBLIC_WORKER_URL` (currently hardcoded to `localhost:5000`)

### Required for Backend (Docker)
- Docker + Docker Compose
- PostgreSQL 15+ (via Docker)
- Redis 7+ (via Docker)
- `.env` with `JWT_SECRET`, `DATABASE_URL`

### Required for Database
- Alembic migrations must run before first use
- `docker compose exec backend python scripts/seed.py` to create admin user

### Required for ML Worker (Native)
- Python 3.10+ (cannot be verified; required by Ultralytics)
- Virtual environment with: `ultralytics`, `opencv-python`, `redis`, `sqlalchemy`, `fastapi`, `uvicorn`, `psycopg2`
- `yolov8s-pose.pt` model file in root directory
- `input videos/04.CCTV Candidate Talking.mkv` video file — **not in repository**
- GPU: Strongly recommended; CUDA-enabled for real-time inference (NVIDIA RTX recommended per PS §Hardware)
- `bytetrack.yaml` tracker config (bundled with Ultralytics)

### Items that work only on developer's local machine
- The hardcoded `VIDEO_PATH` — the specific `.mkv` file is a local asset, not committed to the repo
- `localhost:5432` in `worker.py` — assumes Docker ports are exposed to host
- `localhost:6379` in `worker.py` — same assumption

### Optional
- CUDA/cuDNN for GPU acceleration (falls back to CPU, which will be too slow for real-time at exam scale)
- NVIDIA Jetson Orin (referenced in PS hardware spec; not required for prototype)

---

## PART 13 — TESTING STATUS

| Test Type | Exists | What is Tested | Tests Live Pipeline? | Status |
|---|---|---|---|---|
| Unit tests | ✅ | `object_detector.py`, `logger.py` | ❌ No — these modules are orphaned | ⚠️ Testing the wrong code |
| Integration tests | ✅ | Simulated student-object spatial association | ❌ No — association logic not in pipeline | ⚠️ Testing the wrong code |
| Behavior engine tests | ❌ | Nothing | ❌ | 🔴 Missing |
| FastAPI endpoint tests | ❌ | Nothing | ❌ | 🔴 Missing |
| Authentication tests | ❌ | Nothing | ❌ | 🔴 Missing |
| WebSocket tests | ❌ | Nothing | ❌ | 🔴 Missing |
| Frontend tests | ❌ | Nothing | ❌ | 🔴 Missing |
| End-to-end pipeline tests | ❌ | Nothing | ❌ | 🔴 Missing |
| Performance/FPS tests | ❌ | Nothing | ❌ | 🔴 Missing |

The irony flagged in Doc2 §31 is accurate and important: the existing tests verify the orphaned `object_detector.py` and `logger.py`, not the actual running system. The behavior engine, FastAPI routes, WebSocket pipeline, and database writes have zero test coverage.

---

## PART 14 — PROBLEM STATEMENT COMPLIANCE SCORE

| Area | Requirements | Implemented | Functional | Compliance |
|---|---|---|---|---|
| ML / Pose | 8 | 6 | 5 | ~60% |
| Object Detection | 3 | 1 (orphaned) | 0 | ~5% |
| Behavior Engine | 8 | 5 | 5 | ~60% |
| False Positive Reduction | 3 | 2 | 2 | ~65% |
| Explainability | 2 | 1 (templates) | 1 | ~40% |
| Backend API | 8 | 6 | 5 | ~65% |
| Database | 5 | 5 | 5 | ~95% |
| Real-time Alerts | 3 | 3 | 3 | ~90% |
| Frontend Dashboard | 7 | 7 | 4 | ~55% |
| Video Streaming | 2 | 2 | 1.5 | ~70% |
| Privacy | 2 | 2 | 2 | ~90% |
| Authentication | 3 | 3 | 2.5 | ~80% |
| Settings/Configuration | 3 | 2 | 0 | ~10% |
| Testing | 4 | 1 (wrong) | 0 | ~5% |
| Evidence Export | 1 | 0 | 0 | 0% |

- **Overall implementation estimate:** ~65% (features exist in some form)
- **Overall functional end-to-end completion:** ~50% (features that work correctly in the live pipeline)
- **Problem-statement compliance:** ~55% (satisfies requirements as a judge would assess them)

---

## PART 15 — WHAT IS ACTUALLY LEFT?

### MUST DO
*(Required to satisfy the problem statement)*

1. **Connect `object_detector.py` to `worker.py`** — phone and paper detection is an explicit PS requirement and the code already exists; it just needs to be wired in.
2. **Implement student-object spatial association** — link detected objects to nearby student tracking IDs.
3. **Make settings actually affect the ML worker** — either have `worker.py` poll `/api/settings/` on an interval, or read from the DB at startup. The settings UI is currently misleading.
4. **Implement `/api/students/` endpoint** — SQL `GROUP BY student_id` on events table; removes the dangerous client-side aggregation.
5. **Move `DB_URL` and `JWT_SECRET` out of source files** — P0 security requirement; also blocks any deployment.
6. **Move `VIDEO_PATH` to environment variable** — without this the project cannot run on any other machine.
7. **Expand `/api/analytics/summary`** — add `total_students` (distinct count) and `average_confidence` (AVG query); removes frontend mocking.
8. **Make MJPEG URL configurable** — `http://localhost:5000/video_feed` hardcoded in frontend breaks all non-localhost deployment.

### SHOULD DO
*(Significantly improves reliability and presentation)*

9. **Async ML database writes** — wrap `db_session.commit()` in a background thread or queue to prevent frame drops.
10. **WebSocket authentication** — pass JWT in WS handshake query param; validate in `websockets.py`.
11. **Behavioral risk score** — composite score across behaviors per student per session; persisted to DB.
12. **Head pitch detection** — important for detecting students looking down at hidden materials.
13. **FPS + active student count** → backend metrics API → dashboard display.
14. **Write tests for `behaviour.py` and the FastAPI routes** — currently all tests cover orphaned code.
15. **CSV event export endpoint** — lost during migration; required for invigilator post-exam review.

### NICE TO HAVE
*(Can be deferred without affecting core deliverable)*

16. LLM integration (Qwen/Llama) for natural-language alert explanations.
17. Hand trajectory tracking (beyond speed).
18. Hip rotation detection.
19. Multi-camera support.
20. WebRTC or HLS replacement for MJPEG at scale.
21. CORS restriction to specific origins.
22. `httpOnly` cookie-based JWT storage.
23. Rate limiting on auth endpoints.
24. Formal Alembic migration for `risk_score` column.

---

## PART 16 — ROADMAP

### Phase 0 — Stabilization
**Objective:** Make the project runnable on any machine with correct credentials.

**Why now?** Nothing else matters if the project can't be started. The hardcoded `VIDEO_PATH` and `DB_URL` mean the project fails immediately on any machine that isn't the developer's.

**Tasks:**
- Create `.env` file with `DB_URL`, `JWT_SECRET`, `VIDEO_PATH`, `MODEL_NAME`, `CONFIDENCE_THRESHOLD`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WORKER_URL`
- Replace all hardcoded values in `worker.py`, `security.py`, and frontend components with environment variable reads
- Verify `docker compose up -d` + `python worker.py` works cleanly from a fresh clone

**Dependencies:** None.

**Expected output:** Project starts from `git clone` + `.env` + `docker compose up` without touching source files.

**Verification:** Run on a second machine or fresh directory with only the `.env` file.

**Problems resolved:** Items 5, 6, 8 from MUST DO list; P0 security issues.

---

### Phase 1 — Settings → ML Integration
**Objective:** Make the Settings UI actually control the ML worker.

**Why now?** Settings is the most visibly broken feature — the UI exists, DB persistence works, but the ML pipeline ignores it entirely. This is also the architectural prerequisite for making behavior thresholds configurable, which the PS requires.

**Tasks:**
- Add a `/api/internal/config` endpoint (or reuse `/api/settings/`) that returns the current threshold values
- Modify `worker.py` to fetch configuration from this endpoint at startup (and optionally on a polling interval)
- Map settings keys to `BehaviorThresholds` fields in `behaviour.py`
- Replace hardcoded `CONFIDENCE = 0.49` and all `BehaviorThresholds` constants with values read from the API response

**Dependencies:** Phase 0 (worker must have valid `API_URL` env var to call FastAPI).

**Expected output:** Changing "Glance Count Threshold" in the Settings UI and restarting the worker results in different behavior.

**Verification:** Set glance count to 1 in Settings; confirm alerts trigger on the first glance in the live feed.

**Problems resolved:** ❌ Broken Settings (Doc2 §25); "Settings are a placebo" finding.

---

### Phase 2 — Object Detection Integration
**Objective:** Connect the orphaned `object_detector.py` to the live pipeline.

**Why now?** Phone/paper detection is an explicit problem statement requirement. The code exists and is tested (even if those tests don't cover the pipeline). This is purely an integration task, not a development task.

**Tasks:**
- Import `object_detector.py` into `worker.py`
- Initialize the object detector alongside the pose model
- Run object detection on each frame (can share the YOLO model or use a separate detection model depending on `object_detector.py`'s implementation)
- For each detected `cell phone` or `book`, determine spatial proximity to the nearest tracked student bounding box
- Create a new behavior event type (e.g., `"object_detected"`) with the associated student ID and object class
- Publish this event to Redis and persist to PostgreSQL following the same path as pose-based events

**Dependencies:** Phase 1 (thresholds for object proximity should be configurable).

**Expected output:** When a phone appears near a tracked student, an alert is generated in the UI with the student ID and object type.

**Verification:** Hold a phone near the camera in the test video path; confirm an alert appears on `/dashboard/alerts`.

**Problems resolved:** 🔴 Object detection not integrated; ❌ Student-object association missing.

---

### Phase 3 — Backend API Completion
**Objective:** Eliminate all frontend mocking and client-side aggregation.

**Why now?** The frontend is currently misleading — displaying "Unavailable" for analytics and aggregating student data incorrectly. These APIs are straightforward SQL queries.

**Tasks:**
- Implement `GET /api/students/` — `SELECT student_id, COUNT(*) as event_count, MAX(timestamp) as last_seen, GROUP_CONCAT(behaviour_type) FROM events GROUP BY student_id`
- Expand `GET /api/analytics/summary` — add `total_students: COUNT(DISTINCT student_id)` and `average_confidence: AVG(confidence)` to the response
- Add `GET /api/events/export` — stream a CSV of the events table (restoring the lost `logger.py` functionality)
- Add `risk_score` field computation to the students query (sum of confidence scores weighted by behavior type)

**Dependencies:** Phase 0 (DB credentials correct); existing event schema is sufficient.

**Expected output:** `/dashboard/students` and `/dashboard/analytics` display real backend data with no mocking.

**Verification:** Confirm `total_students` matches the actual distinct student count in the DB; confirm Students page no longer shows the "client-side aggregation" warning.

**Problems resolved:** 🔴 Missing `/api/students/`; 🟡 Analytics mocking; CSV export missing.

---

### Phase 4 — Async ML Pipeline
**Objective:** Decouple database writes from the YOLO inference loop to prevent frame drops.

**Why now?** Phases 1–3 increase the number of things happening per frame (object detection + settings polling). If DB writes remain synchronous and blocking, FPS will degrade further.

**Tasks:**
- Introduce a Python `queue.Queue` in `worker.py`
- Push event dicts to the queue from the YOLO loop (non-blocking)
- Create a dedicated background thread that drains the queue and performs DB writes and Redis publishes
- Measure FPS before and after; emit FPS as a periodic Redis publish to a `metrics` channel
- Add `GET /api/metrics` to FastAPI that returns last-known FPS and active student count

**Dependencies:** Phases 0–2 complete (all pipeline stages should be stable before async refactor).

**Expected output:** FPS stays stable during DB write spikes; dashboard shows real-time FPS.

**Verification:** Introduce artificial PostgreSQL latency (e.g., `pg_sleep`); confirm video stream does not stutter.

**Problems resolved:** Synchronous ML logging causing frame drops; missing FPS metric on dashboard.

---

### Phase 5 — Security Hardening
**Objective:** Make the system safe for demonstration in a shared network environment.

**Why now?** A hackathon demo often runs on a shared WiFi. An unauthenticated WebSocket broadcasting real-time exam alerts and an unauthenticated MJPEG stream are both visible to anyone on the network.

**Tasks:**
- Add JWT validation to `WS /api/ws/alerts` — accept token as query parameter `?token=<jwt>`, validate on connection
- Restrict CORS to specific origins (localhost + demo domain)
- Verify seed script uses a strong default admin password from `.env`
- Add basic rate limiting to `POST /api/auth/login` (even a simple in-memory counter is sufficient for demo)

**Dependencies:** Phase 0 (JWT must come from env, not hardcoded, before securing endpoints with it).

**Expected output:** Only authenticated invigilators can view alerts and video stream.

**Problems resolved:** P1 WebSocket auth gap; P1 CORS wildcard.

---

### Phase 6 — Testing
**Objective:** Replace tests covering orphaned code with tests covering the actual pipeline.

**Why now?** Before the demo, you need confidence that the alert pipeline works end-to-end. Manual testing is insufficient.

**Tasks:**
- Write unit tests for `behaviour.py` — feed synthetic keypoint sequences and assert correct alert generation
- Write FastAPI integration tests for `/api/events/`, `/api/analytics/summary`, `/api/students/`, `/api/auth/`
- Write a pipeline integration test: mock a ML event → publish to Redis → assert WebSocket message received
- Retire or clearly label the existing tests as "orphaned module tests"

**Dependencies:** Phases 3–5 (APIs must be stable before being tested).

**Expected output:** `pytest` passes; core alert pipeline has verifiable test coverage.

**Problems resolved:** Zero test coverage on live pipeline; tests covering dead code.

---

### Phase 7 — Demo Readiness
**Objective:** Prepare the system for presentation.

**Why now?** All technical gaps resolved; final pass on presentation quality.

**Tasks:**
- Ensure the system runs from a documented sequence of 3–4 commands
- Prepare a demo video or live demo with a real CCTV-style video showing detection → alert → dashboard
- Verify behavioral risk score appears on the Students page
- Confirm CSV export is downloadable from the Events page
- Write a 1-page deployment guide

**Dependencies:** All previous phases.

**Expected output:** A judge can watch a demonstration where a suspicious behavior triggers a real-time alert in the dashboard with an explanation and confidence score.

---

## PART 17 — CRITICAL DEPENDENCY CHAIN

```
Problem Statement
    ↓
Phase 0: Environment Variables & Credentials
    ↓
Phase 1: Settings → ML Worker Integration
    (thresholds must be configurable before object detection adds more)
    ↓
Phase 2: Object Detection Integration
    (object_detector.py wired into worker.py)
    ↓
Phase 3: Backend API Completion
    (/api/students/, analytics expansion, CSV export)
    ↓
Phase 4: Async ML Pipeline
    (decouple DB writes from inference loop)
    ↓
Phase 5: Security Hardening
    (WebSocket auth, CORS, rate limiting)
    ↓
Phase 6: Testing
    (behavior engine + API + pipeline integration tests)
    ↓
Phase 7: Demo Readiness
    ↓
Demonstration
```

**Architectural blockers:**
- **Blocker A:** `VIDEO_PATH` and `DB_URL` being hardcoded blocks everything — no one else can run the project.
- **Blocker B:** ML worker ignoring settings means configurable thresholds are impossible until Phase 1 is complete.
- **Blocker C:** Object detection being orphaned means the PS's phone/paper requirement cannot be demonstrated until Phase 2.

---

## PART 18 — "DO NOT START YET" LIST

- **Do not integrate an LLM (Qwen/Llama)** before the rule-based behavior engine is fully tested. Adding a non-deterministic LLM layer on top of untested rule logic compounds debugging difficulty exponentially.
- **Do not redesign the Settings UI** before settings actually affect the ML worker (Phase 1). UI polish on a placebo is wasted effort.
- **Do not polish the Analytics or Students pages** before the backend endpoints return real data (Phase 3). Designing around mocked data creates UI debt.
- **Do not add WebRTC or HLS streaming** before the single-viewer MJPEG pipeline is stable and the async refactor (Phase 4) is done. Streaming infrastructure is a large effort with diminishing returns for a prototype.
- **Do not run performance benchmarks** before the async DB write decoupling (Phase 4) is in place. Current numbers are artificially bad.
- **Do not add multi-camera support** before the single-camera pipeline is fully integrated and tested.
- **Do not attempt to add head pitch or hip rotation** before the existing 5 behaviors are connected to configurable settings and tested.

---

## PART 19 — FINAL EXECUTIVE VERDICT

**1. What percentage of the original problem statement is genuinely implemented?**
~55%. The core pose-based behavioral pipeline is real and working. Object detection, student-object association, configurable thresholds, evidence export, and behavioral risk scores are absent or disconnected.

**2. What percentage is actually functional end-to-end?**
~50%. The alert pipeline (head turn → DB → Redis → WebSocket → UI) works. Settings, students page, analytics depth, and object detection do not function end-to-end.

**3. What is the biggest blocker?**
Hardcoded `VIDEO_PATH` and `DB_URL` in source code. The project cannot run on any machine except the developer's without source edits.

**4. What is the biggest ML gap?**
`object_detector.py` is fully written and tested but never called by `worker.py`. Phone and paper detection — an explicit PS requirement — contributes zero to the running system.

**5. What is the biggest backend gap?**
`/api/students/` does not exist. The frontend is forced into client-side aggregation of 500 events, which is both architecturally wrong and breaks for students with more than 500 events.

**6. What is the biggest frontend gap?**
The Settings page gives users the impression of control but has zero effect on ML behavior. This is the most misleading part of the system and would be immediately apparent to any technical reviewer.

**7. What is the biggest integration gap?**
The ML worker has no connection to the FastAPI layer. It bypasses the API entirely, writes directly to PostgreSQL, and ignores all settings stored via the API. The two halves of the system (ML worker / FastAPI+Next.js) are integrated only through the database and Redis — but not through the API that controls them.

**8. What is the biggest security/privacy issue?**
`JWT_SECRET = "dummy_secret_for_hackathon"` committed to source. Anyone reading the repository can forge tokens for any role, including admin.

**9. What can be demonstrated TODAY?**
The core behavioral alert pipeline: pose detection → head-turn/hand-movement behavior → real-time WebSocket alert in dashboard → historical event log. Live video streaming. Authentication with role-based access. The system is visually impressive and the core loop is genuinely functional.

**10. What absolutely must be completed before the project can be considered complete?**
Environment variable externalization, `object_detector.py` integration, settings-to-ML-worker connection, `/api/students/` endpoint, async DB writes.

**11. What can safely be deferred?**
LLM explainability, WebRTC streaming, multi-camera support, head pitch, hip rotation, rate limiting, `httpOnly` cookies.

**12. What should you start working on tomorrow?**
**Phase 0 — Environment Variables.** Create the `.env` file and replace every hardcoded value in `worker.py` and `security.py`. This is a two-hour task that unblocks everything else and eliminates the two P0 security issues simultaneously. Do this before writing a single line of new feature code.
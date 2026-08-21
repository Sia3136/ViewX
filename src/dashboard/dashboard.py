import sys
from pathlib import Path

# Add project root to path so we can resolve fully qualified imports (src.pipeline.live_cctv)
project_root = Path(__file__).resolve().parents[2]
if str(project_root) not in sys.path:
    sys.path.append(str(project_root))

import json
from src.pipeline.live_cctv import LiveCCTVEngine
import streamlit as st
import cv2
# ============================================================
# MONITORING SESSION STATE
# ============================================================

if "engine" not in st.session_state:
    st.session_state.engine = None

if "monitoring" not in st.session_state:
    st.session_state.monitoring = False
# ============================================================
# PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="DRISHTI AI",
    page_icon="👁️",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ============================================================
# SESSION STATE
# ============================================================

if "dark_mode" not in st.session_state:
    st.session_state.dark_mode = True


# ============================================================
# PATHS
# ============================================================

LOG_PATH = Path("logs/events.json")
VIDEO_PATH = Path("data/videos/sample.mp4")


# ============================================================
# LOAD EVENTS
# ============================================================

def load_events():
    if not LOG_PATH.exists():
        return []

    try:
        return json.loads(
            LOG_PATH.read_text(encoding="utf-8")
        )
    except (json.JSONDecodeError, OSError):
        return []


events = load_events()


# ============================================================
# CALCULATE STATISTICS
# ============================================================

student_ids = sorted(
    {
        str(event.get("student_id"))
        for event in events
        if event.get("student_id")
    }
)

high_alerts = 0
medium_alerts = 0
low_alerts = 0

for event in events:

    confidence = float(
        event.get("confidence", 0)
    )

    if confidence >= 0.85:
        high_alerts += 1

    elif confidence >= 0.70:
        medium_alerts += 1

    else:
        low_alerts += 1


# ============================================================
# THEME
# ============================================================

dark_mode = st.session_state.dark_mode

if dark_mode:

    background = "#080c16"
    card = "#101827"
    text = "#f4f7ff"
    muted = "#9aa7bd"
    border = "#27344b"

else:

    background = "#f4f7fb"
    card = "#ffffff"
    text = "#172033"
    muted = "#65728a"
    border = "#d7deea"


# ============================================================
# THEME CSS
#
# Only CSS is injected here.
# There are NO visible HTML divs.
# ============================================================

st.markdown(
    f"""
    <style>

    .stApp {{
        background-color: {background};
    }}

    [data-testid="stAppViewContainer"] {{
        background-color: {background};
    }}

    [data-testid="stHeader"] {{
        background-color: {background};
    }}

    section[data-testid="stSidebar"] {{
        background-color: {card};
    }}

    .block-container {{
        padding-top: 1.5rem;
        padding-bottom: 2rem;
    }}

    h1, h2, h3, h4, h5, h6 {{
        color: {text} !important;
    }}

    p, label {{
        color: {text};
    }}

    </style>
    """,
    unsafe_allow_html=True,
)


# ============================================================
# SIDEBAR
# ============================================================

with st.sidebar:

    st.title("👁️ DRISHTI AI")

    st.caption(
        "EXAMINATION MONITORING SYSTEM"
    )

    st.divider()

    st.subheader("Active Session")

    st.write("🏫 Examination Hall")
    st.caption("CCTV Monitoring Session")

    st.divider()

    st.page_link(
        "dashboard.py",
        label="▦ Dashboard",
    )

    st.page_link(
        "pages/01_Live_Feeds.py",
        label="⚠️ Active Alerts",
    )

    st.divider()

    st.subheader("System")

    st.success("Camera system ready")
    st.success("Event logger ready")
    st.success("Privacy mode ON")

    st.divider()

    st.subheader("Appearance")

    theme_toggle = st.toggle(
        "🌙 Dark Mode",
        value=st.session_state.dark_mode,
    )

    if theme_toggle != st.session_state.dark_mode:

        st.session_state.dark_mode = theme_toggle

        st.rerun()

    st.divider()

    st.caption("DRISHTI AI • Hackathon Prototype")


# ============================================================
# HEADER
# ============================================================

header_left, header_right = st.columns(
    [4, 1]
)

with header_left:

    st.title(
        "Examination Dashboard"
    )

    st.caption(
        "Real-time CCTV surveillance, behavioural analysis "
        "and explainable alerts"
    )

with header_right:

    st.success("● SYSTEM LIVE")


# ============================================================
# TOP METRICS
# ============================================================

st.write("")

m1, m2, m3, m4 = st.columns(4)

with m1:

    st.metric(
        "Students Monitored",
        len(student_ids),
    )

with m2:

    st.metric(
        "High Alerts",
        high_alerts,
    )

with m3:

    st.metric(
        "Medium Alerts",
        medium_alerts,
    )

with m4:

    st.metric(
        "Total Events",
        len(events),
    )


st.divider()


# ============================================================
# MAIN DASHBOARD
# ============================================================

video_column, alert_column = st.columns(
    [2.2, 1]
)


# ============================================================
# LIVE DRISHTI PIPELINE
# ============================================================

with video_column:

    st.subheader("🎥 Live Surveillance Feed")

    st.caption(
        "CAM-01 • CCTV Source • YOLO + Pose + Tracking"
    )

    start_pipeline = st.button(
        "▶ Start DRISHTI Monitoring",
        key="start_pipeline",
    )

    if start_pipeline:

        engine = LiveCCTVEngine(
            video_path="data/videos/sample.mp4"
        )

        frame_placeholder = st.empty()

        status_placeholder = st.empty()

        alert_placeholder = st.empty()

        for frame, active_alerts in engine.run():

            # --------------------------------------------
            # Convert OpenCV BGR → RGB
            # --------------------------------------------

            frame_rgb = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB,
            )

            # --------------------------------------------
            # Display processed CCTV
            # --------------------------------------------

            frame_placeholder.image(
                frame_rgb,
                channels="RGB",
                use_container_width=True,
            )

            # --------------------------------------------
            # LIVE STATUS
            # --------------------------------------------

            status_placeholder.success(
                "● DRISHTI AI PIPELINE RUNNING"
            )

            # --------------------------------------------
            # LIVE ALERT
            # --------------------------------------------

            if active_alerts:

                alert_placeholder.error(
                    f"🚨 ACTIVE ALERTS: "
                    f"{len(active_alerts)}"
                )

            else:

                alert_placeholder.info(
                    "✓ No active behavioural alerts"
                )


# ============================================================
# ALERT FEED
# ============================================================

with alert_column:

    st.subheader(
        "🚨 Alert Feed"
    )

    if events:

        recent_events = list(
            reversed(events[-6:])
        )

        for event in recent_events:

            confidence = float(
                event.get(
                    "confidence",
                    0,
                )
            )

            student = event.get(
                "student_id",
                "Unknown",
            )

            behaviour = str(
                event.get(
                    "behaviour_type",
                    "Unknown",
                )
            ).replace(
                "_",
                " ",
            ).title()

            explanation = event.get(
                "explanation",
                "No explanation available.",
            )

            if confidence >= 0.85:

                level = "🔴 HIGH"

            elif confidence >= 0.70:

                level = "🟠 MEDIUM"

            else:

                level = "🟡 LOW"

            with st.container(
                border=True
            ):

                st.write(
                    f"**{level}**"
                )

                st.write(
                    f"**Student {student}**"
                )

                st.write(
                    f"**{behaviour}**"
                )

                st.caption(
                    explanation
                )

                st.caption(
                    f"Confidence: {confidence:.0%}"
                )

    else:

        st.info(
            "No recent alerts."
        )

    st.page_link(
        "pages/01_Live_Feeds.py",
        label="View all alerts →",
    )


# ============================================================
# SECONDARY INFORMATION
# ============================================================

st.divider()

st.subheader(
    "📊 Monitoring Overview"
)

info1, info2, info3 = st.columns(3)


with info1:

    with st.container(border=True):

        st.write(
            "**CCTV Status**"
        )

        st.success(
            "Video source available"
            if VIDEO_PATH.exists()
            else "Video source unavailable"
        )


with info2:

    with st.container(border=True):

        st.write(
            "**Behaviour Monitoring**"
        )

        st.write(
            "Head direction"
        )

        st.write(
            "Hand movement"
        )

        st.write(
            "Repeated behaviour"
        )


with info3:

    with st.container(border=True):

        st.write(
            "**Privacy**"
        )

        st.success(
            "Anonymous student IDs"
        )

        st.caption(
            "Names, roll numbers, face images "
            "and face embeddings are not stored."
        )


# ============================================================
# SYSTEM STATUS
# ============================================================

st.divider()

st.subheader(
    "⚙️ System Status"
)

s1, s2, s3, s4 = st.columns(4)

with s1:
    st.success("Event Logger")

with s2:
    st.success("Behaviour Engine")

with s3:
    st.success("Privacy Layer")

with s4:
    st.success("Dashboard")


# ============================================================
# REFRESH
# ============================================================

st.write("")

if st.button(
    "🔄 Refresh Dashboard"
):

    st.rerun()

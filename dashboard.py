import json
from pathlib import Path

import pandas as pd
import streamlit as st


st.set_page_config(
    page_title="DRISHTI AI",
    page_icon="👁️",
    layout="wide",
)

st.title("DRISHTI AI — Examination Monitoring")
st.caption("Day 1 dashboard skeleton • Behavioural monitoring, not automatic cheating verdicts")

LOG_PATH = Path("logs/events.json")


def load_events():
    if not LOG_PATH.exists():
        return []

    try:
        return json.loads(LOG_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


events = load_events()

col1, col2, col3 = st.columns(3)
col1.metric("Events Logged", len(events))

student_ids = sorted({e.get("student_id") for e in events if e.get("student_id")})
col2.metric("Students in Events", len(student_ids))

avg_conf = (
    sum(float(e.get("confidence", 0)) for e in events) / len(events)
    if events
    else 0
)
col3.metric("Average Confidence", f"{avg_conf:.2f}")

st.divider()

left, right = st.columns([2, 1])

with left:
    st.subheader("Live Video")
    st.info(
        "Day 1 placeholder. The real detection/tracking/pose video stream "
        "will be connected here on Day 2–3."
    )

with right:
    st.subheader("System Status")
    st.success("Project structure ready")
    st.success("Event logging ready")
    st.success("Privacy rules configured")
    st.warning("Perception pipeline not connected yet")

st.subheader("Active / Recent Alerts")

if events:
    rows = []
    for event in reversed(events[-100:]):
        rows.append(
            {
                "Timestamp": event.get("timestamp"),
                "Student": event.get("student_id"),
                "Behaviour": event.get("behaviour_type"),
                "Confidence": event.get("confidence"),
                "Explanation": event.get("explanation"),
            }
        )
    st.dataframe(pd.DataFrame(rows), use_container_width=True)
else:
    st.info("No events yet. Use mock_alerts.py to test the dashboard.")

st.subheader("Privacy")
st.write(
    "The Day 1 design stores anonymous student IDs and behavioural metadata. "
    "Names, roll numbers, face images and face embeddings are not stored."
)

if st.button("Refresh"):
    st.rerun()

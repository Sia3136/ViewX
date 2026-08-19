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
st.caption(
    "Behavioural monitoring and explainable alerts — "
    "not automatic cheating verdicts"
)

# --------------------------------------------------
# Configuration
# --------------------------------------------------

LOG_PATH = Path("logs/events.json")


# --------------------------------------------------
# Load events
# --------------------------------------------------

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


# --------------------------------------------------
# Alert severity
# --------------------------------------------------

def get_alert_level(confidence):

    confidence = float(confidence)

    if confidence >= 0.85:
        return "HIGH"

    if confidence >= 0.70:
        return "MEDIUM"

    return "LOW"


# --------------------------------------------------
# Dashboard metrics
# --------------------------------------------------

col1, col2, col3 = st.columns(3)

col1.metric(
    "Events Logged",
    len(events)
)

student_ids = sorted(
    {
        e.get("student_id")
        for e in events
        if e.get("student_id")
    }
)

col2.metric(
    "Students in Events",
    len(student_ids)
)

avg_conf = (
    sum(
        float(e.get("confidence", 0))
        for e in events
    ) / len(events)
    if events
    else 0
)

col3.metric(
    "Average Confidence",
    f"{avg_conf:.0%}"
)


st.divider()


# --------------------------------------------------
# Video + system status
# --------------------------------------------------

left, right = st.columns([2, 1])

with left:

    st.subheader("Live Video")

    st.info(
        "The real detection, tracking and pose video stream "
        "will be connected to this panel when the perception "
        "pipeline is integrated."
    )

with right:

    st.subheader("System Status")

    st.success("Project structure ready")
    st.success("Event logging ready")
    st.success("Privacy rules configured")
    st.success("Explainable alert pipeline ready")
    st.warning("Perception pipeline not connected yet")


st.divider()


# --------------------------------------------------
# Active / Recent Alerts
# --------------------------------------------------

st.subheader("Active / Recent Alerts")


if events:

    # Display newest events first
    recent_events = list(reversed(events[-100:]))

    for event in recent_events:

        confidence = float(
            event.get("confidence", 0)
        )

        level = get_alert_level(confidence)

        student = event.get(
            "student_id",
            "unknown"
        )

        behaviour = event.get(
            "behaviour_type",
            "unknown behaviour"
        )

        explanation = event.get(
            "explanation",
            "No explanation available."
        )

        timestamp = event.get(
            "timestamp",
            "Unknown time"
        )

        # ------------------------------
        # Alert card
        # ------------------------------

        with st.container(border=True):

            top_col1, top_col2, top_col3 = st.columns(
                [1, 3, 1]
            )

            with top_col1:
                st.write(f"**{level}**")

            with top_col2:
                st.write(
                    f"**{student} — "
                    f"{behaviour.replace('_', ' ').title()}**"
                )

            with top_col3:
                st.write(
                    f"**{confidence:.0%}**"
                )

            st.caption(
                f"Time: {timestamp}"
            )

            st.write(
                f"**Explanation:** {explanation}"
            )

else:

    st.info(
        "No events yet. Run mock_alerts.py "
        "to generate test events."
    )


# --------------------------------------------------
# Event table
# --------------------------------------------------

st.divider()

st.subheader("Event Timeline")


if events:

    rows = []

    for event in recent_events:

        confidence = float(
            event.get("confidence", 0)
        )

        rows.append(
            {
                "Severity": get_alert_level(confidence),
                "Timestamp": event.get("timestamp"),
                "Student": event.get("student_id"),
                "Behaviour": event.get("behaviour_type"),
                "Confidence": f"{confidence:.0%}",
                "Explanation": event.get("explanation"),
            }
        )

    st.dataframe(
        pd.DataFrame(rows),
        use_container_width=True,
        hide_index=True,
    )

else:

    st.info("No events available.")


# --------------------------------------------------
# Student alert summary
# --------------------------------------------------

st.divider()

st.subheader("Alerts by Student")


if events:

    student_counts = {}

    for event in events:

        student = event.get("student_id")

        if student:
            student_counts[student] = (
                student_counts.get(student, 0) + 1
            )

    summary_rows = [
        {
            "Student": student,
            "Alert Count": count,
        }
        for student, count
        in sorted(
            student_counts.items(),
            key=lambda x: x[1],
            reverse=True,
        )
    ]

    st.dataframe(
        pd.DataFrame(summary_rows),
        use_container_width=True,
        hide_index=True,
    )

else:

    st.info("No student events available.")


# --------------------------------------------------
# Privacy
# --------------------------------------------------

st.divider()

st.subheader("Privacy")

st.write(
    "The system uses anonymous student IDs and behavioural "
    "metadata for monitoring. Names, roll numbers, face "
    "images and face embeddings are not stored."
)


# --------------------------------------------------
# Refresh
# --------------------------------------------------

if st.button("Refresh"):

    st.rerun()
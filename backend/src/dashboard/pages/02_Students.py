import json
from pathlib import Path

import streamlit as st


st.set_page_config(
    page_title="ExamGuard — Students",
    page_icon="👥",
    layout="wide",
)


st.title("Students")
st.caption(
    "Anonymous student monitoring overview."
)


LOG_PATH = Path("logs/events.json")


if LOG_PATH.exists():

    try:
        events = json.loads(
            LOG_PATH.read_text(
                encoding="utf-8"
            )
        )

    except json.JSONDecodeError:
        events = []

else:
    events = []


students = {}

for event in events:

    sid = event.get("student_id")

    if not sid:
        continue

    if sid not in students:

        students[sid] = {
            "events": 0,
            "last_behaviour": "None",
        }

    students[sid]["events"] += 1

    students[sid]["last_behaviour"] = (
        event.get(
            "behaviour_type",
            "Unknown",
        )
    )


if not students:

    st.info(
        "No student events have been detected yet."
    )

else:

    for student_id, data in students.items():

        with st.container(
            border=True
        ):

            col1, col2, col3 = st.columns(3)

            col1.metric(
                "Student",
                student_id,
            )

            col2.metric(
                "Events",
                data["events"],
            )

            col3.write(
                f"Last behaviour: "
                f"**{data['last_behaviour']}**"
            )
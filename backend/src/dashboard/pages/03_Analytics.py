import json
from pathlib import Path

import pandas as pd
import streamlit as st


st.set_page_config(
    page_title="ExamGuard — Analytics",
    page_icon="📊",
    layout="wide",
)


st.title("Analytics")
st.caption(
    "Behavioural monitoring statistics."
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


if not events:

    st.info(
        "Analytics will appear after events are detected."
    )

else:

    df = pd.DataFrame(events)


    col1, col2, col3 = st.columns(3)


    col1.metric(
        "Total Events",
        len(df),
    )


    col2.metric(
        "Students",
        df["student_id"].nunique(),
    )


    col3.metric(
        "Average Confidence",
        f"{df['confidence'].mean():.0%}",
    )


    st.subheader(
        "Behaviour Distribution"
    )

    behaviour_counts = (
        df["behaviour_type"]
        .value_counts()
    )

    st.bar_chart(
        behaviour_counts
    )
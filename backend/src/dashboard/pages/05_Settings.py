import streamlit as st


st.set_page_config(
    page_title="ExamGuard — Settings",
    page_icon="⚙️",
    layout="wide",
)


st.title("Settings")


st.subheader("Appearance")


if "dark_mode" not in st.session_state:

    st.session_state.dark_mode = True


st.toggle(
    "Dark Mode",
    value=st.session_state.dark_mode,
    key="dark_mode",
)


st.subheader("Monitoring")


st.toggle(
    "Privacy Mode",
    value=True,
    disabled=True,
)


st.toggle(
    "Behaviour Alerts",
    value=True,
)


st.toggle(
    "Pose Tracking",
    value=True,
)


st.subheader("Camera")


st.selectbox(
    "Video Source",
    [
        "sample.mp4",
        "Live Camera",
    ],
)


st.info(
    "CCTV integration will use the selected "
    "camera/video source."
)
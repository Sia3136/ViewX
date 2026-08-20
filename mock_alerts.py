from logger import EventLogger

logger = EventLogger(
    json_path="logs/events.json",
    csv_path="logs/events.csv",
    privacy_config={
        "anonymized_student_ids": True,
        "store_raw_keypoints": True,
        "keypoint_decimals": 3,
    },
)

sample_events = [
    {
        "student_id": "student_001",
        "behaviour_type": "sideward_glance_observation",
        "confidence": 0.78,
        "explanation": "Student 001 showed repeated sideward head orientation to the left.",
    },
    {
        "student_id": "student_004",
        "behaviour_type": "unusual_hand_movement",
        "confidence": 0.69,
        "explanation": "Student 004 showed repeated hand movement near the desk area.",
    },
]

for item in sample_events:
    logger.log_observation(**item)

print("Mock events added to logs/events.json and logs/events.csv")

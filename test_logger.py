from logger import EventLogger


def test_event_creation():
    logger = EventLogger(
        "logs/test_events.json",
        "logs/test_events.csv",
        {
            "anonymized_student_ids": True,
            "store_raw_keypoints": True,
            "keypoint_decimals": 3,
        },
    )

    event = logger.create_event(
        student_id="student_001",
        behaviour_type="test_observation",
        confidence=0.95,
        explanation="Test event",
        keypoints_snapshot=[[10.123456, 20.654321, 0.987654]],
    )

    assert event["student_id"] == "student_001"
    assert event["confidence"] == 0.95
    assert event["keypoints_snapshot"][0] == [10.123, 20.654, 0.988]


if __name__ == "__main__":
    test_event_creation()
    print("Logger test passed.")

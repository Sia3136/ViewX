from src.utils.schemas import BehaviourEvent
from src.utils.logger import EventLogger
from src.alerts.alert import AlertManager
from src.utils.integration import IntegrationEngine


def main():

    logger = EventLogger(
        "logs/integration_test.json",
        "logs/integration_test.csv",
        {
            "anonymized_student_ids": True,
            "store_raw_keypoints": True,
            "keypoint_decimals": 3,
        },
    )

    alert_manager = AlertManager(
        minimum_confidence=0.60
    )

    engine = IntegrationEngine(
        logger=logger,
        alert_manager=alert_manager,
    )

    event = BehaviourEvent(
        student_id="student_004",
        behaviour_type="repeated_sideward_glance",
        confidence=0.86,
        explanation=(
            "Student 004 repeatedly turned "
            "their head toward the left."
        ),
        frame_number=240,
        evidence={
            "direction": "left",
            "duration_seconds": 2.8,
        },
    )

    alert = engine.process_behaviour_event(event)

    print("\nGenerated alert:")
    print(alert)


if __name__ == "__main__":
    main()
from src.utils.schemas import BehaviourEvent
from src.utils.integration import IntegrationEngine
from src.utils.logger import EventLogger
from src.alerts.alert import AlertManager


class LiveIntegration:

    def __init__(self):

        self.logger = EventLogger(
            "logs/events.json",
            "logs/events.csv",
            {
                "anonymized_student_ids": True,
                "store_raw_keypoints": True,
                "keypoint_decimals": 3,
            },
        )

        self.alert_manager = AlertManager(
            minimum_confidence=0.60
        )

        self.engine = IntegrationEngine(
            logger=self.logger,
            alert_manager=self.alert_manager,
        )

    def process_alert(
        self,
        student_id,
        behaviour_type,
        confidence,
        explanation,
        frame_number=None,
        evidence=None,
    ):

        event = BehaviourEvent(
            student_id=str(student_id),
            behaviour_type=behaviour_type,
            confidence=float(confidence),
            explanation=explanation,
            frame_number=frame_number,
            evidence=evidence or {},
        )

        return self.engine.process_behaviour_event(event)
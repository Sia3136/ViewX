from schemas import BehaviourEvent


class AlertManager:

    def __init__(self, minimum_confidence=0.60):
        self.minimum_confidence = minimum_confidence

    def create_alert(self, event: BehaviourEvent):

        if event.confidence < self.minimum_confidence:
            return None

        return {
            "student_id": event.student_id,
            "behaviour_type": event.behaviour_type,
            "confidence": round(event.confidence, 3),
            "explanation": event.explanation,
            "timestamp": event.timestamp,
            "frame_number": event.frame_number,
            "evidence": event.evidence,
        }

    def format_alert(self, event: BehaviourEvent):

        return (
            f"Student {event.student_id} — "
            f"{event.behaviour_type.replace('_', ' ').title()} "
            f"({event.confidence:.0%}) — "
            f"{event.explanation}"
        )
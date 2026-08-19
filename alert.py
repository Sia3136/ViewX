class AlertManager:
    """
    Converts detected behavioural events into dashboard-ready alerts.
    """

    def create_alert(self, event):
        return {
            "student_id": event["student_id"],
            "behaviour_type": event["behaviour_type"],
            "confidence": event["confidence"],
            "explanation": event["explanation"],
            "timestamp": event["timestamp"],
        }

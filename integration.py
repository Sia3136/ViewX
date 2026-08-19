from alert import AlertManager
from logger import EventLogger


class IntegrationEngine:

    def __init__(self, logger, alert_manager):

        self.logger = logger
        self.alert_manager = alert_manager

    def process_behaviour_event(self, event):

        alert = self.alert_manager.create_alert(event)

        if alert is None:
            return None

        self.logger.log_behaviour_event(event)

        return alert

    def process_behaviour_events(self, events):

        alerts = []

        for event in events:

            alert = self.process_behaviour_event(event)

            if alert is not None:
                alerts.append(alert)

        return alerts
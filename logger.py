import csv
import json
from datetime import datetime, timezone
from pathlib import Path

from schemas import BehaviourEvent


class EventLogger:
    """
    Central event logger.

    Event format:
    timestamp
    student_id
    behaviour_type
    confidence
    explanation
    keypoints_snapshot
    """

    CSV_FIELDS = [
        "timestamp",
        "student_id",
        "behaviour_type",
        "confidence",
        "explanation",
        "keypoints_snapshot",
    ]

    def __init__(self, json_path, csv_path, privacy_config=None):
        self.json_path = Path(json_path)
        self.csv_path = Path(csv_path)
        self.privacy_config = privacy_config or {}

        self.json_path.parent.mkdir(parents=True, exist_ok=True)
        self.csv_path.parent.mkdir(parents=True, exist_ok=True)

        if not self.json_path.exists():
            self.json_path.write_text("[]", encoding="utf-8")

        if not self.csv_path.exists():
            with self.csv_path.open("w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=self.CSV_FIELDS)
                writer.writeheader()

    def _sanitize_student_id(self, student_id):
        # Student IDs should already be anonymous.
        # This intentionally does not accept names/roll numbers.
        if not self.privacy_config.get("anonymized_student_ids", True):
            return str(student_id)
        return str(student_id)

    def _sanitize_keypoints(self, keypoints):
        if keypoints is None:
            return None

        if not self.privacy_config.get("store_raw_keypoints", True):
            return None

        decimals = int(self.privacy_config.get("keypoint_decimals", 3))

        return [
            [
                round(float(point[0]), decimals),
                round(float(point[1]), decimals),
                round(float(point[2]), decimals) if len(point) > 2 else 1.0,
            ]
            for point in keypoints
        ]

    def create_event(
        self,
        student_id,
        behaviour_type,
        confidence,
        explanation,
        keypoints_snapshot=None,
        timestamp=None,
    ):
        event = {
            "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
            "student_id": self._sanitize_student_id(student_id),
            "behaviour_type": str(behaviour_type),
            "confidence": round(float(confidence), 3),
            "explanation": str(explanation),
            "keypoints_snapshot": self._sanitize_keypoints(keypoints_snapshot),
        }
        return event

    def log_event(self, event):
        # JSON
        try:
            data = json.loads(self.json_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, FileNotFoundError):
            data = []

        data.append(event)
        self.json_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        # CSV
        row = dict(event)
        row["keypoints_snapshot"] = json.dumps(
            event["keypoints_snapshot"], ensure_ascii=False
        )

        with self.csv_path.open("a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.CSV_FIELDS)
            writer.writerow(row)

        return event

    def log_observation(
        self,
        student_id,
        behaviour_type,
        confidence,
        explanation,
        keypoints_snapshot=None,
    ):
        event = self.create_event(
            student_id=student_id,
            behaviour_type=behaviour_type,
            confidence=confidence,
            explanation=explanation,
            keypoints_snapshot=keypoints_snapshot,
        )
        return self.log_event(event)
    def log_behaviour_event(self, event: BehaviourEvent):

        return self.log_observation(
            student_id=event.student_id,
            behaviour_type=event.behaviour_type,
            confidence=event.confidence,
            explanation=event.explanation,
            keypoints_snapshot=event.evidence.get("keypoints"),
        )
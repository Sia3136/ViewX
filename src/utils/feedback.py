import json
import os
from collections import defaultdict

FEEDBACK_FILE = "outputs/feedback.json"

class FeedbackManager:
    def __init__(self):
        self.false_counts = defaultdict(int)   # behavior_type → how many times marked false
        self.load()

    def load(self):
        if os.path.exists(FEEDBACK_FILE):
            with open(FEEDBACK_FILE, "r") as f:
                data = json.load(f)
                self.false_counts = defaultdict(int, data.get("false_counts", {}))

    def save(self):
        os.makedirs("outputs", exist_ok=True)
        with open(FEEDBACK_FILE, "w") as f:
            json.dump({"false_counts": dict(self.false_counts)}, f, indent=2)

    def mark_false(self, behavior_type: str):
        self.false_counts[behavior_type] += 1
        self.save()
        print(f" Feedback saved: {behavior_type} marked as FALSE (count={self.false_counts[behavior_type]})")

    def get_confidence_penalty(self, behavior_type: str) -> float:
        """More false marks → higher penalty (max 0.4)"""
        count = self.false_counts.get(behavior_type, 0)
        return min(0.4, count * 0.08)
class ObjectDetector:
    """
    Day 1 interface for prohibited/unwanted object detection.

    Planned objects include mobile phone and paper/chit where feasible.
    """

    def __init__(self, model_path=None):
        self.model_path = model_path

    def detect(self, frame):
        return []

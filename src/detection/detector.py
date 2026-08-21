class PersonDetector:
    """
    Integration interface for the perception teammate's detector.

    Expected output:
    [
        {
            "bbox": [x1, y1, x2, y2],
            "confidence": 0.91,
            "class_name": "person"
        },
        ...
    ]
    """

    def __init__(self, model_path=None):
        self.model_path = model_path

    def detect(self, frame):
        # TODO Day 1 integration: connect YOLO person detector.
        return []

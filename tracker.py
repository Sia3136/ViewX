class MultiPersonTracker:
    """
    Integration interface for ByteTrack/DeepSORT.

    Expected input:
        person detections

    Expected output:
        tracked people with stable anonymous IDs.
    """

    def __init__(self, tracker_name="bytetrack"):
        self.tracker_name = tracker_name

    def update(self, detections, frame):
        # TODO: connect the real tracker.
        return []

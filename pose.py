class PoseEstimator:
    """
    Integration interface for YOLO-Pose or MediaPipe/RTMPose.

    Expected output per tracked student:
        student_id
        bbox
        keypoints (at least 17 landmarks)
    """

    def __init__(self, model_path=None):
        self.model_path = model_path

    def estimate(self, frame, tracked_people):
        # TODO: connect the real pose model.
        return tracked_people

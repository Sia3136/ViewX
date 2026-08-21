import cv2
from pathlib import Path


class VideoPipeline:
    """
    Day 1 video foundation.

    For now this module:
    1. Opens a webcam or recorded video.
    2. Reads frames.
    3. Provides a clean place to attach detector/tracker/pose outputs.
    4. Displays/saves the processed stream.

    The actual perception modules will be connected by the team later.
    """

    def __init__(self, config, logger=None):
        self.config = config
        self.logger = logger

    def process_frame(self, frame, frame_index):
        """
        Integration point for the real pipeline.

        Later:
        frame -> detector -> tracker -> pose -> behaviour/object engine
        """
        return frame

    def run(self, source):
        cap = cv2.VideoCapture(source)

        if not cap.isOpened():
            raise RuntimeError(f"Could not open video source: {source}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 25.0

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720

        max_width = self.config["video"].get("max_width", 1280)
        max_height = self.config["video"].get("max_height", 720)

        scale = min(max_width / width, max_height / height, 1.0)
        out_w = int(width * scale)
        out_h = int(height * scale)

        writer = None
        if self.config["video"].get("save_output", True):
            output_path = self.config["video"]["output_path"]
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_path, fourcc, fps, (out_w, out_h))

        frame_index = 0

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            if scale != 1.0:
                frame = cv2.resize(frame, (out_w, out_h))

            processed = self.process_frame(frame, frame_index)

            if writer is not None:
                writer.write(processed)

            if self.config["video"].get("display", True):
                cv2.imshow("DRISHTI AI - Day 1 Video Pipeline", processed)
                key = cv2.waitKey(1) & 0xFF
                if key in (27, ord("q")):
                    break

            frame_index += 1

        cap.release()
        if writer is not None:
            writer.release()
        cv2.destroyAllWindows()

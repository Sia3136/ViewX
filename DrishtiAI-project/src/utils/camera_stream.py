import cv2


class CameraStream:

    def __init__(self, source=0):

        self.source = source
        self.cap = None
        self.running = False

    def start(self):

        if self.running:
            return True

        self.cap = cv2.VideoCapture(
            self.source,
            cv2.CAP_DSHOW
        )

        if not self.cap.isOpened():
            self.cap.release()
            self.cap = None
            return False

        self.running = True
        return True

    def read(self):

        if not self.running or self.cap is None:
            return None

        success, frame = self.cap.read()

        if not success:
            return None

        return frame

    def stop(self):

        if self.cap is not None:
            self.cap.release()

        self.cap = None
        self.running = False

    def is_running(self):

        return self.running
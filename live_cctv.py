import cv2
import time
import numpy as np

from collections import defaultdict, deque
from ultralytics import YOLO

from logger import EventLogger


# ============================================================
# CONFIG
# ============================================================

MODEL_NAME = "yolov8s-pose.pt"

CONFIDENCE = 0.49

HISTORY_LENGTH = 60

VIDEO_PATH = "data/videos/sample.mp4"


# ============================================================
# SKELETON
# ============================================================

SKELETON = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],

    [5, 6],
    [5, 7],
    [7, 9],
    [6, 8],
    [8, 10],

    [5, 11],
    [6, 12],
    [11, 12],

    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],
]


# ============================================================
# LIVE CCTV ENGINE
# ============================================================

class LiveCCTVEngine:

    def __init__(self, video_path=VIDEO_PATH):

        self.video_path = video_path

        self.model = YOLO(MODEL_NAME)

        self.student_history = defaultdict(
            lambda: deque(maxlen=HISTORY_LENGTH)
        )

        self.student_turns = defaultdict(int)

        self.last_direction = {}

        self.active_alerts = {}

        self.alert_cooldown = defaultdict(int)

        self.logged_alerts = {}

        # ----------------------------------------------------
        # Event Logger
        # ----------------------------------------------------

        self.logger = EventLogger(
            json_path="logs/events.json",
            csv_path="logs/events.csv",
            privacy_config={
                "anonymized_student_ids": True,
                "store_raw_keypoints": False,
                "keypoint_decimals": 3,
            },
        )


    # ========================================================
    # STUDENT FEATURES
    # ========================================================

    def get_student_features(self):

        current_students = {}

        for track_id, history in self.student_history.items():

            if not history:
                continue

            latest = history[-1]

            current_students[track_id] = {

                "id": track_id,

                "box": latest["box"],

                "head_direction": latest["direction"],

                "head_turns": self.student_turns[track_id],

                "shoulder_angle":
                    latest.get(
                        "shoulder_angle",
                        0,
                    ),

                "hand_movement":
                    latest.get(
                        "hand_movement",
                        0,
                    ),
            }

        return current_students


    # ========================================================
    # CREATE ALERT
    # ========================================================

    def create_alert(
        self,
        student_id,
        behaviour_type,
        confidence,
        explanation,
        frame_number,
    ):

        # ----------------------------------------------------
        # Prevent duplicate alerts
        # ----------------------------------------------------

        alert_key = (
            student_id,
            behaviour_type,
        )

        current_frame = frame_number

        previous_frame = self.logged_alerts.get(
            alert_key,
            -999999,
        )

        # Don't log the same alert every frame
        if current_frame - previous_frame < 45:
            return None

        self.logged_alerts[alert_key] = current_frame

        # ----------------------------------------------------
        # Log event
        # ----------------------------------------------------

        event = self.logger.log_observation(
            student_id=f"student_{int(student_id):03d}",

            behaviour_type=behaviour_type,

            confidence=confidence,

            explanation=explanation,
        )

        return event


    # ========================================================
    # PROCESS VIDEO
    # ========================================================

    def run(self):

        cap = cv2.VideoCapture(
            self.video_path
        )

        if not cap.isOpened():

            raise RuntimeError(
                f"Cannot open CCTV video: "
                f"{self.video_path}"
            )


        fps = cap.get(
            cv2.CAP_PROP_FPS
        )

        if fps <= 0:
            fps = 25


        frame_number = 0


        while True:

            success, frame = cap.read()

            if not success:
                break


            frame_number += 1


            # =================================================
            # YOLO POSE + TRACKING
            # =================================================

            results = self.model.track(
                frame,

                persist=True,

                conf=CONFIDENCE,

                verbose=False,

                tracker="bytetrack.yaml",
            )


            annotated_frame = frame.copy()


            current_track_ids = set()


            # =================================================
            # PROCESS DETECTIONS
            # =================================================

            if results:

                result = results[0]

                boxes = result.boxes

                keypoints = result.keypoints


                if (
                    boxes is not None
                    and keypoints is not None
                    and boxes.id is not None
                ):

                    ids = boxes.id.int().cpu().tolist()

                    xyxy = (
                        boxes.xyxy
                        .cpu()
                        .numpy()
                    )

                    kpts = (
                        keypoints.xy
                        .cpu()
                        .numpy()
                    )


                    for i, track_id in enumerate(ids):

                        track_id = int(
                            track_id
                        )

                        current_track_ids.add(
                            track_id
                        )


                        x1, y1, x2, y2 = (
                            map(
                                int,
                                xyxy[i],
                            )
                        )


                        points = kpts[i]


                        # ------------------------------------------------
                        # Make sure required pose points exist
                        # ------------------------------------------------

                        if len(points) < 17:
                            continue


                        nose = points[0]

                        left_shoulder = points[5]

                        right_shoulder = points[6]

                        left_wrist = points[9]

                        right_wrist = points[10]


                        # ------------------------------------------------
                        # Shoulder center
                        # ------------------------------------------------

                        shoulder_center_x = (
                            left_shoulder[0]
                            + right_shoulder[0]
                        ) / 2


                        # ------------------------------------------------
                        # Head direction
                        # ------------------------------------------------

                        head_offset = (
                            nose[0]
                            - shoulder_center_x
                        )


                        if head_offset > 20:

                            direction = "Right"

                        elif head_offset < -20:

                            direction = "Left"

                        else:

                            direction = "Center"


                        # ------------------------------------------------
                        # Shoulder angle
                        # ------------------------------------------------

                        shoulder_dx = (
                            right_shoulder[0]
                            - left_shoulder[0]
                        )

                        shoulder_dy = (
                            right_shoulder[1]
                            - left_shoulder[1]
                        )

                        shoulder_angle = np.degrees(
                            np.arctan2(
                                shoulder_dy,
                                shoulder_dx,
                            )
                        )


                        # ------------------------------------------------
                        # Hand movement
                        # ------------------------------------------------

                        hand_movement = 0


                        if (
                            track_id
                            in self.student_history
                            and len(
                                self.student_history[
                                    track_id
                                ]
                            ) > 5
                        ):

                            previous = (
                                self.student_history[
                                    track_id
                                ][-1]
                            )


                            if (
                                "left_wrist"
                                in previous
                            ):

                                lw_dist = np.linalg.norm(
                                    left_wrist
                                    - previous[
                                        "left_wrist"
                                    ]
                                )

                                rw_dist = np.linalg.norm(
                                    right_wrist
                                    - previous[
                                        "right_wrist"
                                    ]
                                )

                                hand_movement = (
                                    lw_dist
                                    + rw_dist
                                )


                        # ------------------------------------------------
                        # Count head turns
                        # ------------------------------------------------

                        if track_id not in self.last_direction:

                            self.last_direction[
                                track_id
                            ] = direction

                        else:

                            if (
                                direction
                                != self.last_direction[
                                    track_id
                                ]
                                and direction
                                != "Center"
                            ):

                                self.student_turns[
                                    track_id
                                ] += 1


                            self.last_direction[
                                track_id
                            ] = direction


                        # ------------------------------------------------
                        # Save history
                        # ------------------------------------------------

                        features = {

                            "direction":
                                direction,

                            "head_offset":
                                head_offset,

                            "shoulder_angle":
                                shoulder_angle,

                            "left_wrist":
                                left_wrist.copy(),

                            "right_wrist":
                                right_wrist.copy(),

                            "hand_movement":
                                hand_movement,

                            "box":
                                [
                                    x1,
                                    y1,
                                    x2,
                                    y2,
                                ],
                        }


                        self.student_history[
                            track_id
                        ].append(
                            features
                        )


                        # =================================================
                        # DRAW PERSON
                        # =================================================

                        cv2.rectangle(
                            annotated_frame,

                            (x1, y1),

                            (x2, y2),

                            (0, 255, 0),

                            1,
                        )


                        cv2.putText(
                            annotated_frame,

                            f"ID {track_id}",

                            (x1, y1 - 10),

                            cv2.FONT_HERSHEY_SIMPLEX,

                            0.6,

                            (0, 255, 0),

                            2,
                        )


                        # =================================================
                        # DRAW KEYPOINTS
                        # =================================================

                        for point in points:

                            px, py = point

                            if px > 0 and py > 0:

                                cv2.circle(
                                    annotated_frame,

                                    (
                                        int(px),
                                        int(py),
                                    ),

                                    2,

                                    (0, 0, 255),

                                    -1,
                                )


                        # =================================================
                        # DRAW SKELETON
                        # =================================================

                        for a, b in SKELETON:

                            if (
                                points[a][0] > 0
                                and points[a][1] > 0
                                and points[b][0] > 0
                                and points[b][1] > 0
                            ):

                                cv2.line(
                                    annotated_frame,

                                    (
                                        int(points[a][0]),
                                        int(points[a][1]),
                                    ),

                                    (
                                        int(points[b][0]),
                                        int(points[b][1]),
                                    ),

                                    (255, 255, 0),

                                    1,
                                )


                        # =================================================
                        # BEHAVIOUR
                        # =================================================

                        alert = None


                        if (
                            self.student_turns[
                                track_id
                            ] >= 3
                        ):

                            alert = {

                                "type":
                                    "repeated_head_turning",

                                "confidence":
                                    0.86,

                                "explanation":
                                    (
                                        f"Student {track_id} "
                                        "repeatedly changed "
                                        "head orientation."
                                    ),
                            }


                        elif direction in [
                            "Left",
                            "Right",
                        ]:

                            alert = {

                                "type":
                                    "sideward_glance",

                                "confidence":
                                    0.78,

                                "explanation":
                                    (
                                        f"Student {track_id} "
                                        f"showed repeated "
                                        f"sideward head "
                                        f"orientation to "
                                        f"the {direction.lower()}."
                                    ),
                            }


                        elif hand_movement > 28:

                            alert = {

                                "type":
                                    "unusual_hand_movement",

                                "confidence":
                                    0.69,

                                "explanation":
                                    (
                                        f"Student {track_id} "
                                        "showed unusual "
                                        "hand movement "
                                        "near the desk area."
                                    ),
                            }


                        # ============================================================
                        # SMALL ALERT LABEL
                        # ============================================================

                            if track_id in self.active_alerts:

                                alert_data = self.active_alerts[track_id]

                                label = (
                                    "ALERT: "
                                    + alert_data["type"]
                                    .replace("_", " ")
                                    .upper()
                                )

                                # Small label only
                                label_y = max(20, y1 - 8)

                                cv2.rectangle(
                                    annotated_frame,
                                    (x1, label_y - 20),
                                    (
                                        x1 + min(
                                            240,
                                            12 * len(label)
                                        ),
                                        label_y,
                                        ),
                                    (0, 0, 180),
                                    -1,
                                )

                                cv2.putText(
                                    annotated_frame,
                                    label,
                                    (x1 + 5, label_y - 5),
                                    cv2.FONT_HERSHEY_SIMPLEX,
                                    0.40,
                                    (255, 255, 255),
                                    1,
                                    cv2.LINE_AA,
                                )


                        # =================================================
                        # INFO
                        # =================================================

                        cv2.putText(
                            annotated_frame,

                            f"Head: {direction}",

                            (
                                x1,
                                y2 + 20,
                            ),

                            cv2.FONT_HERSHEY_SIMPLEX,

                            0.5,

                            (255, 255, 0),

                            2,
                        )


            # ============================================================
            # GLOBAL STATUS
            # ============================================================

            cv2.putText(
                annotated_frame,

                f"DRISHTI AI | Frame {frame_number}",

                (20, 30),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.7,

                (0, 255, 0),

                2,
            )


            # ============================================================
            # YIELD FRAME + ALERTS
            # ============================================================

            yield (
                annotated_frame,
                list(
                    self.active_alerts.values()
                ),
            )


        cap.release()
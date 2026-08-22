import cv2
from ultralytics import YOLO
from ultralytics.trackers.byte_tracker import BYTETracker

class Args:
    track_thresh = 0.45
    match_thresh = 0.8
    track_buffer = 30
    gmc_method = 'sparseOptFlow'
    frame_rate = 5

model = YOLO('yolov8s-pose.pt')
cap = cv2.VideoCapture(r'..\input videos\04.CCTV Candidate Talking.mkv')
ret, frame = cap.read()

res = model.predict(frame, stream=False)[0]

t = BYTETracker(Args())
print("Trying to update with res.boxes...")
try:
    tracks = t.update(res.boxes, frame)
    print("Success! Tracks:", tracks)
    print("Tracks type:", type(tracks))
    if tracks:
        print("Track 0 type:", type(tracks[0]))
        print("Track 0 dir:", dir(tracks[0]))
except Exception as e:
    import traceback
    traceback.print_exc()

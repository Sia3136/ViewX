import sys
import os
import time
import cv2
from unittest.mock import MagicMock

# Ensure we can import from backend and root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Mock Environment Variables
os.environ["DATABASE_URL"] = "postgresql://dummy:dummy@localhost/dummy"

# Mock Database and Redis before importing VideoStreamManager
import src.core.video_manager
src.core.video_manager.SessionLocal = MagicMock()
src.core.video_manager.Student = MagicMock()
src.core.video_manager.Event = MagicMock()
mock_redis_class = MagicMock()
mock_redis_client = MagicMock()
mock_redis_class.return_value = mock_redis_client
src.core.video_manager.redis.Redis = mock_redis_class

from src.core.video_manager import VideoStreamManager, VideoProcessor

def test_pipeline():
    print("--- Test 0 & 3: Environment & OpenCV Check ---")
    print(f"cv2 version: {cv2.__version__}")
    
    video_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "input videos", "04.CCTV Candidate Talking.mkv"))
    print(f"Video path: {video_path}")
    cap = cv2.VideoCapture(video_path)
    print("Opened:", cap.isOpened())
    if not cap.isOpened():
        print("FAILED to open video. Exiting test.")
        return
    print("FPS:", cap.get(cv2.CAP_PROP_FPS))
    print("Width:", cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    print("Height:", cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    ret, frame = cap.read()
    print("First frame:", ret, frame.shape if ret else None)
    cap.release()
    
    print("\n--- Tests 4-11: Testing VideoStreamManager (ML Pipeline) ---")
    manager = VideoStreamManager()
    
    # Patch _trigger_alert to print directly
    original_trigger = VideoProcessor._trigger_alert
    def mock_trigger(self, student_id, alert):
        print(f"\n>>>>>>>> [ALERT TRIGGERED] Track: {student_id}, Behavior: {alert['behavior']}, Reason: {alert.get('reason', '')} <<<<<<<<\n")
        original_trigger(self, student_id, alert)
    VideoProcessor._trigger_alert = mock_trigger

    print(f"Starting stream on source_id 1...")
    manager.start_stream(source_id=1, location=video_path)
    processor = manager.get_processor(1)
    
    print("Pipeline started. Running for 30 seconds to allow YOLO, tracking, and behaviour models to spin up...")
    
    last_printed_history = {}

    for i in range(30):
        time.sleep(1)
        if processor:
            # print some basic stats every second
            active_tracks = list(processor.student_history.keys())
            if active_tracks:
                print(f"Second {i+1} | Tracked IDs: {active_tracks}")
                for tid in active_tracks:
                    hist_len = len(processor.student_history[tid])
                    if hist_len > 0 and (tid not in last_printed_history or last_printed_history[tid] < hist_len):
                        latest = processor.student_history[tid][-1]
                        # Just print what features we are extracting
                        feat_keys = [k for k in latest.keys() if k not in ['box', 'timestamp']]
                        print(f"   -> Track {tid} history len: {hist_len}, Features extracted: {feat_keys}")
                        last_printed_history[tid] = hist_len
            else:
                print(f"Second {i+1} | No tracks yet...")
    
    print("\nShutting down pipeline...")
    manager.stop_stream(1)
    
    print("\n--- Test 12 & 15: Redis Publish Check ---")
    calls = mock_redis_client.publish.call_args_list
    print(f"Redis publish called {len(calls)} times.")
    for call in calls:
        print(f"Published to channel: {call[0][0]}")
        print(f"Payload: {call[0][1][:100]}...")
        
    print("\nTest completed.")

if __name__ == '__main__':
    test_pipeline()

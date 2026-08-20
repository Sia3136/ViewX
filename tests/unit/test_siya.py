"""
test_siya.py

Tests the behavior definitions, baseline object detection, 
and pose extraction logic implemented for Siya's Day 1 tasks.
"""

import numpy as np
from src.pose.pose import get_head_orientation_and_hand_positions
from src.detection.object_detector import ProhibitedObjectDetector
from src.behaviour.behaviour import BehaviorThresholds

def test_pose_extraction():
    print("--- Testing Pose Extraction ---")
    
    # Mock keypoints: 17 keypoints (x, y)
    # Nose=0, LShoulder=5, RShoulder=6, LWrist=9, RWrist=10
    kpts = np.zeros((17, 2))
    kpts[5] = [100, 50]  # Left Shoulder
    kpts[6] = [200, 50]  # Right Shoulder (Center is 150)
    
    # Test Center
    kpts[0] = [150, 40]  # Nose
    kpts[9] = [90, 100]  # Left Wrist
    kpts[10] = [210, 100] # Right Wrist
    
    res = get_head_orientation_and_hand_positions(kpts)
    print(f"Center Test: {res['head_orientation']} (Expected: Center)")
    
    # Test Right
    kpts[0] = [180, 40]  # Nose offset +30
    res = get_head_orientation_and_hand_positions(kpts)
    print(f"Right Test:  {res['head_orientation']} (Expected: Right)")
    
    # Test Left
    kpts[0] = [120, 40]  # Nose offset -30
    res = get_head_orientation_and_hand_positions(kpts)
    print(f"Left Test:   {res['head_orientation']} (Expected: Left)")

def test_behavior_thresholds():
    print("\n--- Testing Behavior Thresholds Loaded ---")
    print(f"Head Yaw Threshold: {BehaviorThresholds.HEAD_YAW_OFFSET_THRESHOLD}")
    print(f"Hand Movement Threshold: {BehaviorThresholds.HAND_MOVEMENT_THRESHOLD}")
    print(f"Excessive Turn Window: {BehaviorThresholds.EXCESSIVE_TURN_WINDOW} seconds")

def test_object_detector():
    print("\n--- Testing Object Detector Initialization ---")
    try:
        detector = ProhibitedObjectDetector()
        print(f"Target Classes: {detector.target_classes} (Expected: [67, 73])")
        print("Model initialized successfully.")
    except Exception as e:
        print(f"Error initializing model: {e}")

def test_facial_features():
    from src.pose.pose import get_facial_features
    print("\n--- Testing Facial Features Extraction ---")
    
    # Mock MediaPipe Face Mesh landmarks (468 points, xyz)
    landmarks = np.zeros((468, 3))
    # Mock left eye points
    landmarks[33] = [10, 10, 0]   # Outer corner
    landmarks[133] = [30, 10, 0]  # Inner corner (Width=20)
    landmarks[160] = [15, 5, 0]   # Top
    landmarks[144] = [15, 15, 0]  # Bottom (Height=10)
    landmarks[158] = [25, 5, 0]   # Top
    landmarks[153] = [25, 15, 0]  # Bottom (Height=10)
    
    # Mock mouth points
    landmarks[78] = [20, 40, 0]   # Left corner
    landmarks[308] = [60, 40, 0]  # Right corner (Width=40)
    landmarks[13] = [40, 35, 0]   # Top inner
    landmarks[14] = [40, 45, 0]   # Bottom inner (Height=10)
    
    res = get_facial_features(landmarks)
    print(f"Facial Features: EAR={res['ear']:.2f}, MAR={res['mar']:.2f}")

if __name__ == "__main__":
    test_pose_extraction()
    test_facial_features()
    test_behavior_thresholds()
    test_object_detector()

"""
pose.py

This module contains utility functions for analyzing pose keypoints,
specifically focusing on extracting head orientation and hand positions.
"""

def get_head_orientation_and_hand_positions(keypoints, yaw_threshold=20.0):
    """
    Extracts head orientation and hand (wrist) positions from a single person's keypoints.
    
    Args:
        keypoints (list or numpy.array): Array of 17 keypoints (x, y). 
                                         Assumes YOLO-Pose format.
        yaw_threshold (float): Threshold in pixels to determine 'Left' or 'Right'.
        
    Returns:
        dict: A dictionary containing:
              - 'head_orientation': "Left", "Right", or "Center"
              - 'head_offset': The calculated numeric offset
              - 'left_hand': (x, y) tuple for left wrist
              - 'right_hand': (x, y) tuple for right wrist
    """
    try:
        # COCO / YOLO-Pose Keypoint Indices:
        # 0: Nose
        # 5: Left Shoulder
        # 6: Right Shoulder
        # 9: Left Wrist
        # 10: Right Wrist
        
        nose = keypoints[0]
        left_shoulder = keypoints[5]
        right_shoulder = keypoints[6]
        left_wrist = keypoints[9]
        right_wrist = keypoints[10]
        
        # Calculate shoulder center
        shoulder_center_x = (left_shoulder[0] + right_shoulder[0]) / 2.0
        
        # Calculate head offset based on nose position relative to shoulder center
        head_offset = nose[0] - shoulder_center_x
        
        # Determine orientation
        if head_offset > yaw_threshold:
            orientation = "Right"
        elif head_offset < -yaw_threshold:
            orientation = "Left"
        else:
            orientation = "Center"
            
        return {
            "head_orientation": orientation,
            "head_offset": float(head_offset),
            "left_hand": (float(left_wrist[0]), float(left_wrist[1])),
            "right_hand": (float(right_wrist[0]), float(right_wrist[1]))
        }
        
    except (IndexError, TypeError) as e:
        # Fallback if keypoints are missing or malformed
        return {
            "head_orientation": "Unknown",
            "head_offset": 0.0,
            "left_hand": (0.0, 0.0),
            "right_hand": (0.0, 0.0)
        }

import math

def _calculate_distance(p1, p2):
    return math.hypot(p2[0] - p1[0], p2[1] - p1[1])

def get_facial_features(face_landmarks):
    """
    Extracts Eye Aspect Ratio (EAR) and Mouth Aspect Ratio (MAR) 
    from MediaPipe face landmarks to detect whispering/lip movement and eye peeking.
    
    Args:
        face_landmarks: A list of 468 (x,y) or (x,y,z) tuples from MediaPipe Face Mesh.
        
    Returns:
        dict: A dictionary containing 'ear' and 'mar' values.
    """
    try:
        # MediaPipe Face Mesh Indices
        # Left Eye: 33, 160, 158, 133, 153, 144
        # Right Eye: 362, 385, 387, 263, 373, 380
        
        # Left Eye EAR
        left_eye_pts = [face_landmarks[i] for i in [33, 160, 158, 133, 153, 144]]
        le_v1 = _calculate_distance(left_eye_pts[1], left_eye_pts[5])
        le_v2 = _calculate_distance(left_eye_pts[2], left_eye_pts[4])
        le_h = _calculate_distance(left_eye_pts[0], left_eye_pts[3])
        left_ear = (le_v1 + le_v2) / (2.0 * le_h) if le_h != 0 else 0
        
        # Right Eye EAR
        right_eye_pts = [face_landmarks[i] for i in [362, 385, 387, 263, 373, 380]]
        re_v1 = _calculate_distance(right_eye_pts[1], right_eye_pts[5])
        re_v2 = _calculate_distance(right_eye_pts[2], right_eye_pts[4])
        re_h = _calculate_distance(right_eye_pts[0], right_eye_pts[3])
        right_ear = (re_v1 + re_v2) / (2.0 * re_h) if re_h != 0 else 0
        
        ear = (left_ear + right_ear) / 2.0
        
        # Mouth MAR
        # Inner lips: 78 (left), 13 (top), 308 (right), 14 (bottom)
        mouth_pts = [face_landmarks[i] for i in [78, 13, 308, 14]]
        m_v = _calculate_distance(mouth_pts[1], mouth_pts[3])
        m_h = _calculate_distance(mouth_pts[0], mouth_pts[2])
        mar = m_v / m_h if m_h != 0 else 0
        
        return {
            "ear": float(ear),
            "mar": float(mar)
        }
    except (IndexError, TypeError) as e:
        return {"ear": 0.0, "mar": 0.0}

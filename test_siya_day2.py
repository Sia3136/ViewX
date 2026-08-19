"""
test_siya_day2.py

Tests the rule-based Behavior Engine and the object-to-student linking logic.
"""

from behaviour import BehaviorEngine
from object_detector import link_objects_to_students

def test_behavior_engine():
    print("\n--- Testing Behavior Engine ---")
    engine = BehaviorEngine()
    
    # 1. Test Sideward Glances
    print("\n1. Repeated Sideward Glances:")
    # Create 3 glances over 5 seconds (timestamp: 0, 2, 4) with duration > 2s each
    features_glance = []
    for t in [0.0, 0.5, 1.0, 1.5, 2.0]:  # Glance 1 (2 secs)
        features_glance.append({"timestamp": t, "head_offset": 25})
    for t in [3.0, 3.5, 4.0, 4.5, 5.0]:  # Glance 2 (2 secs)
        features_glance.append({"timestamp": t, "head_offset": -25})
    for t in [6.0, 6.5, 7.0, 7.5, 8.0]:  # Glance 3 (2 secs)
        features_glance.append({"timestamp": t, "head_offset": 25})
        
    res = engine.detect_sideward_glances(features_glance)
    print("Alert (3 glances):", res)

    # Insufficient glances
    res = engine.detect_sideward_glances(features_glance[:10]) # Only 2 glances
    print("Alert (2 glances):", res)

    # 2. Test Excessive Head Turning
    print("\n2. Excessive Head Turning:")
    features_turns = [
        {"timestamp": 1, "head_orientation": "Left"},
        {"timestamp": 2, "head_orientation": "Center"},
        {"timestamp": 3, "head_orientation": "Right"},
        {"timestamp": 4, "head_orientation": "Center"},
        {"timestamp": 5, "head_orientation": "Left"},
        {"timestamp": 6, "head_orientation": "Right"} # 5 changes
    ]
    res = engine.detect_excessive_head_turns(features_turns)
    print("Alert (5 turns):", res)
    
    res = engine.detect_excessive_head_turns(features_turns[:3]) # 2 changes
    print("Alert (2 turns):", res)

    # 3. Test Hand Movements
    print("\n3. Unusual Hand Movements:")
    features_hands = []
    for t in range(4): # Sustained for 3 secs
        features_hands.append({"timestamp": float(t), "hand_movement": 50.0})
    res = engine.detect_unusual_hand_movements(features_hands)
    print("Alert (Sustained > 3s):", res)
    
    res = engine.detect_unusual_hand_movements([{"timestamp": 1.0, "hand_movement": 50.0}])
    print("Alert (Brief < 3s):", res)

def test_object_linking():
    print("\n--- Testing Object Linking ---")
    
    students = [
        {"id": "Student_A", "box": [100, 100, 200, 300]}, # Center: 150, 200
        {"id": "Student_B", "box": [300, 100, 400, 300]}  # Center: 350, 200
    ]
    
    objects = [
        # Object inside Student A's box
        {"box": [120, 150, 160, 200], "confidence": 0.9, "class_name": "cell phone"},
        # Object close to Student B but outside
        {"box": [420, 150, 450, 200], "confidence": 0.85, "class_name": "book"},
        # Object very far away (should be unassigned)
        {"box": [800, 800, 850, 850], "confidence": 0.7, "class_name": "cell phone"}
    ]
    
    linked = link_objects_to_students(objects, students, max_distance=150.0)
    for obj in linked:
        print(f"Object: {obj['class_name']} at {obj['box']} -> Assigned to: {obj['assigned_student_id']} (Confidence: {obj['association_confidence']})")

if __name__ == "__main__":
    test_behavior_engine()
    test_object_linking()

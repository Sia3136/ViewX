"""
demo_simulator.py

Synthetic rule-engine demonstration script.
Generates synthetic temporal feature streams (simulating a 30 FPS video) for various scenarios
and pipes them into the BehaviorEngine to demonstrate false-positive reduction and
temporal persistence rules for a presentation/demo.

NOTE: This is a rule-engine demonstration, NOT real classroom video processing.
"""

from src.behaviour.behaviour import BehaviorEngine
from src.detection.object_detector import link_objects_to_students

def simulate_frames(duration_sec, fps=30):
    return [i / fps for i in range(int(duration_sec * fps))]

def run_scenario(name, description, history, detector_func, expected_detected):
    print(f"\n{'='*60}")
    print(f"SCENARIO: {name}")
    print(f"DESC: {description}")
    print(f"EXPECTED ALERT: {'YES' if expected_detected else 'NO'}")
    print(f"{'-'*60}")
    
    result = detector_func(history)
    
    print(f"TRIGGERED: {'YES' if result['detected'] else 'NO'}")
    if result['detected']:
        print(f"BEHAVIOUR: {result['behavior']}")
        print(f"CONFIDENCE: {result['confidence']:.2f}")
        print(f"REASON: {result['reason']}")
    elif result.get('normal_behaviour'):
        print(f"FILTER ACTIVATED: Suppressed due to normal behaviour '{result['normal_behaviour']}'")
    else:
        print(f"REASON: {result['reason']}")
        
    passed = result['detected'] == expected_detected
    print(f"\nRESULT: {'✅ PASS' if passed else '❌ FAIL'}")
    print(f"{'='*60}")
    return passed

def run_all_demos():
    engine = BehaviorEngine()
    fps = 30
    all_passed = True
    
    # --------------------------------------------------------------------------
    # Scenario 1: Normal Writing (False Positive Suppression)
    # --------------------------------------------------------------------------
    history_writing = []
    for t in simulate_frames(5.0):
        # Nose below shoulders, hands below shoulders, lots of movement
        history_writing.append({
            "timestamp": t,
            "left_shoulder": (100, 100),
            "right_shoulder": (200, 100),
            "nose": (150, 115), 
            "left_hand": (140, 180),
            "right_hand": (160, 180),
            "hand_movement": 30.0 
        })
    passed = run_scenario(
        "Normal Writing",
        "Student is looking down with hands close together, but generating large hand movement keypoint shifts. Should be filtered.",
        history_writing,
        engine.detect_unusual_hand_movements,
        expected_detected=False
    )
    all_passed = all_passed and passed

    # --------------------------------------------------------------------------
    # Scenario 2: Normal Stretching (False Positive Suppression)
    # --------------------------------------------------------------------------
    history_stretch = []
    for t in simulate_frames(4.0):
        # Hands go above the head and shoulders, large movement
        history_stretch.append({
            "timestamp": t,
            "left_shoulder": (100, 100),
            "right_shoulder": (200, 100),
            "nose": (150, 50), 
            "left_hand": (120, 10), 
            "right_hand": (180, 10),
            "hand_movement": 45.0 
        })
    passed = run_scenario(
        "Normal Stretching",
        "Student raises both hands above their head for a few seconds. Should be filtered.",
        history_stretch,
        engine.detect_unusual_hand_movements,
        expected_detected=False
    )
    all_passed = all_passed and passed

    # --------------------------------------------------------------------------
    # Scenario 3: Brief Side Glance (Temporal Rejection)
    # --------------------------------------------------------------------------
    history_glance = []
    for t in simulate_frames(10.0):
        is_glance = 2.0 <= t <= 4.0 # Just one glance
        history_glance.append({
            "timestamp": t,
            "left_shoulder": (100, 100),
            "right_shoulder": (200, 100),
            "nose": (150, 50),
            "head_offset": 30.0 if is_glance else 0.0,
        })
    passed = run_scenario(
        "Brief Side Glance",
        "Student looks left once for 2 seconds then looks back. Should not trigger repeated glances.",
        history_glance,
        engine.detect_sideward_glances,
        expected_detected=False
    )
    all_passed = all_passed and passed

    # --------------------------------------------------------------------------
    # Scenario 4: Repeated Sideward Glances (True Positive)
    # --------------------------------------------------------------------------
    history_cheat_glance = []
    for t in simulate_frames(10.0):
        # 3 distinct glances > 1.5s each
        is_glance = (1.0 <= t <= 3.0) or (4.0 <= t <= 6.0) or (7.0 <= t <= 9.0)
        history_cheat_glance.append({
            "timestamp": t,
            "left_shoulder": (100, 100),
            "right_shoulder": (200, 100),
            "nose": (150, 50),
            "head_offset": 30.0 if is_glance else 0.0,
        })
    passed = run_scenario(
        "Repeated Sideward Glances",
        "Student repeatedly looks off-screen 3 times within the rolling window.",
        history_cheat_glance,
        engine.detect_sideward_glances,
        expected_detected=True
    )
    all_passed = all_passed and passed

    # --------------------------------------------------------------------------
    # Scenario 5: Phone Association (True Positive)
    # --------------------------------------------------------------------------
    print(f"\n{'='*60}")
    print(f"SCENARIO: Mobile Phone Association")
    print(f"DESC: Phone detected intersecting with Student 42's bounding box.")
    print(f"EXPECTED ALERT: YES (Assigned to 42)")
    print(f"{'-'*60}")
    
    objects = [{"box": [120, 120, 140, 140], "confidence": 0.88, "class_name": "cell phone"}]
    students = [{"id": 42, "box": [100, 50, 200, 200], "left_hand": (130, 130), "right_hand": (150, 150)}]
    linked = link_objects_to_students(objects, students)
    
    is_assigned = linked[0]["assigned_student_id"] == 42
    print(f"ASSIGNED TO: {linked[0]['assigned_student_id']}")
    print(f"CONFIDENCE: {linked[0]['association_confidence']:.2f}")
    
    passed = is_assigned and linked[0]["association_confidence"] >= 0.9
    print(f"\nRESULT: {'✅ PASS' if passed else '❌ FAIL'}")
    print(f"{'='*60}")
    all_passed = all_passed and passed

    if all_passed:
        print("\n🎉 ALL DEMO SCENARIOS PASSED SUCCESSFULLY.")
    else:
        print("\n⚠️ SOME DEMO SCENARIOS FAILED.")

if __name__ == "__main__":
    run_all_demos()

from src.behaviour.behaviour import BehaviorEngine
from src.detection.object_detector import link_objects_to_students
from src.alerts.alert import AlertManager
from src.utils.schemas import BehaviourEvent
from collections import defaultdict

def test_day3_alert_generation():
    engine = BehaviorEngine()
    alert_manager = AlertManager()
    
    # 1. Test Temporal History
    history = [
        {"timestamp": 1.0, "head_offset": 25.0, "shoulder_angle": 5.0, "hand_movement": 10.0, "left_hand": (100, 100), "right_hand": (150, 150), "nose": (125, 50)},
        {"timestamp": 2.0, "head_offset": 25.0, "shoulder_angle": 5.0, "hand_movement": 10.0, "left_hand": (100, 100), "right_hand": (150, 150), "nose": (125, 50)},
        {"timestamp": 3.0, "head_offset": 25.0, "shoulder_angle": 5.0, "hand_movement": 10.0, "left_hand": (100, 100), "right_hand": (150, 150), "nose": (125, 50)},
        {"timestamp": 4.0, "head_offset": 25.0, "shoulder_angle": 5.0, "hand_movement": 10.0, "left_hand": (100, 100), "right_hand": (150, 150), "nose": (125, 50)},
    ]
    
    # Repeated glances shouldn't trigger yet (needs 3 distinct glances)
    result = engine.detect_sideward_glances(history)
    assert not result["detected"]
    
    # Test Body Rotation (threshold > 15, requires sustained 3s)
    history_rot = []
    for i in range(100):
        history_rot.append({
            "timestamp": i / 30.0,
            "shoulder_angle": 20.0,
            "left_shoulder": (100, 100),
            "right_shoulder": (200, 100),
            "nose": (150, 50)
        })
    rot_result = engine.detect_body_rotation(history_rot)
    assert rot_result["detected"]
    
    # Create the structured alert
    event = BehaviourEvent(
        student_id="3",
        behaviour_type=rot_result["behavior"],
        confidence=rot_result["confidence"],
        explanation=f"Observed: {rot_result['reason']}",
        timestamp=3.3,
        frame_number=100
    )
    
    formatted_alert = alert_manager.create_alert(event)
    assert formatted_alert is not None
    assert "Student 3" in alert_manager.format_alert(event)
    assert "Body Rotation" in alert_manager.format_alert(event)
    assert "Observed: Shoulder angle 20.0° exceeded threshold continuously" in formatted_alert["explanation"]

def test_day3_object_association():
    alert_manager = AlertManager()
    
    obj_results = [
        {"box": [10, 10, 20, 20], "confidence": 0.9, "class_name": "cell phone", "class_id": 67}
    ]
    
    students_data = [
        {"id": 5, "box": [5, 5, 25, 25], "left_hand": (10, 10), "right_hand": (20, 20)}
    ]
    
    linked = link_objects_to_students(obj_results, students_data)
    assert len(linked) == 1
    assert linked[0]["assigned_student_id"] == 5
    
    # Generate the alert
    event = BehaviourEvent(
        student_id=str(linked[0]['assigned_student_id']),
        behaviour_type="prohibited_object",
        confidence=linked[0]['association_confidence'],
        explanation=f"Prohibited {linked[0]['class_name']} detected near Student {linked[0]['assigned_student_id']}.",
        timestamp=18.7,
        frame_number=200,
        evidence={"object": linked[0]['class_name'], "object_conf": linked[0]['confidence']}
    )
    
    formatted_alert = alert_manager.create_alert(event)
    assert formatted_alert["student_id"] == "5"
    assert formatted_alert["behaviour_type"] == "prohibited_object"
    assert formatted_alert["confidence"] > 0.9
    assert "Prohibited cell phone detected near Student 5" in formatted_alert["explanation"]

def test_debouncing_logic():
    # Simulating the cooldown logic from dayvideo1_perception.py
    alert_cooldown = defaultdict(int)
    fps = 25
    active_alerts = {}
    
    sid = 3
    behavior_type = "repeated_sideward_glance"
    cooldown_key = (sid, behavior_type)
    
    # Frame 1: Alert triggered
    if alert_cooldown[cooldown_key] <= 0:
        active_alerts[sid] = "Alert string"
        alert_cooldown[cooldown_key] = int(fps * 3)
    
    assert sid in active_alerts
    assert alert_cooldown[cooldown_key] == 75
    
    # Frame 2: Same alert triggered, should be suppressed
    alert_generated = False
    if alert_cooldown[cooldown_key] <= 0:
        alert_generated = True
        alert_cooldown[cooldown_key] = int(fps * 3)
        
    assert not alert_generated
    assert alert_cooldown[cooldown_key] == 75
    
    # Tick down
    for _ in range(75):
        alert_cooldown[cooldown_key] -= 1
        
    assert alert_cooldown[cooldown_key] == 0
    
    # Frame 77: Cooldown expired, alert triggers again
    if alert_cooldown[cooldown_key] <= 0:
        alert_generated = True
        alert_cooldown[cooldown_key] = int(fps * 3)
        
    assert alert_generated
    assert alert_cooldown[cooldown_key] == 75

if __name__ == "__main__":
    test_day3_alert_generation()
    test_day3_object_association()
    test_debouncing_logic()
    print("All Day 3 Integration tests passed.")

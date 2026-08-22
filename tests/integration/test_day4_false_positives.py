import unittest
from src.behaviour.behaviour import BehaviorEngine
from src.detection.object_detector import link_objects_to_students

class TestDay4FalsePositives(unittest.TestCase):
    def setUp(self):
        self.engine = BehaviorEngine()

    def test_writing_is_not_hand_movement_alert(self):
        history = []
        for i in range(100):
            feat = {
                "timestamp": i / 30.0,
                "left_shoulder": (100, 100),
                "right_shoulder": (200, 100),
                "nose": (150, 115),
                "left_hand": (140, 180),
                "right_hand": (160, 180),
                "hand_movement": 30.0
            }
            history.append(feat)
            
        result = self.engine.detect_unusual_hand_movements(history)
        
        self.assertFalse(result["detected"], "Writing should not trigger unusual hand movement alert")
        self.assertEqual(result["normal_behaviour"], "writing")

    def test_stretching_is_not_hand_movement_alert(self):
        history = []
        for i in range(100):
            feat = {
                "timestamp": i / 30.0,
                "left_shoulder": (100, 100),
                "right_shoulder": (200, 100),
                "nose": (150, 50), 
                "left_hand": (120, 20),
                "right_hand": (180, 20),
                "hand_movement": 50.0 
            }
            history.append(feat)
            
        result = self.engine.detect_unusual_hand_movements(history)
        
        self.assertFalse(result["detected"])
        self.assertEqual(result["normal_behaviour"], "stretching")

    def test_brief_side_glance_is_not_repeated_glance_alert(self):
        history = []
        for i in range(300):
            time = i / 30.0
            is_glance = 2.0 <= time <= 5.0
            feat = {
                "timestamp": time,
                "head_offset": 30.0 if is_glance else 0.0,
                "left_shoulder": (100, 100),
                "right_shoulder": (200, 100),
                "nose": (150, 50)
            }
            history.append(feat)
            
        result = self.engine.detect_sideward_glances(history)
        self.assertFalse(result["detected"])

    def test_sustained_side_glances_trigger_alert(self):
        history = []
        for i in range(300):
            time = i / 30.0
            is_glance = (1.0 <= time <= 3.0) or (4.0 <= time <= 6.0) or (7.0 <= time <= 9.0)
            feat = {
                "timestamp": time,
                "head_offset": 30.0 if is_glance else 0.0,
                "left_shoulder": (100, 100),
                "right_shoulder": (200, 100),
                "nose": (150, 50)
            }
            history.append(feat)
            
        result = self.engine.detect_sideward_glances(history)
        self.assertTrue(result["detected"])

    def test_excessive_head_turning_requires_multiple_events(self):
        history = []
        for i in range(150):
            time = i / 10.0
            direction = "Center"
            if 2 <= time <= 4:
                direction = "Left"
            elif 6 <= time <= 8:
                direction = "Right"
                
            feat = {
                "timestamp": time,
                "head_orientation": direction,
                "left_shoulder": (100, 100),
                "right_shoulder": (200, 100),
                "nose": (150, 50)
            }
            history.append(feat)
            
        result = self.engine.detect_excessive_head_turns(history)
        self.assertFalse(result["detected"])

    def test_body_rotation_requires_duration(self):
        history = []
        for i in range(90): 
            time = i / 30.0
            feat = {
                "timestamp": time,
                "shoulder_angle": 20.0 if time >= 2.0 else 0.0, 
                "left_shoulder": (100, 100),
                "right_shoulder": (200, 100),
                "nose": (150, 50)
            }
            history.append(feat)
            
        result = self.engine.detect_body_rotation(history)
        self.assertFalse(result["detected"])

    def test_phone_is_associated_with_correct_student(self):
        objects = [{"box": [50, 50, 70, 70], "confidence": 0.9, "class_name": "cell phone"}]
        students = [{"id": 1, "box": [40, 40, 100, 100]}]
        
        linked = link_objects_to_students(objects, students)
        self.assertEqual(linked[0]["assigned_student_id"], 1)
        self.assertGreater(linked[0]["association_confidence"], 0.8)

    def test_ambiguous_object_is_not_randomly_assigned(self):
        objects = [{"box": [100, 100, 120, 120], "confidence": 0.9, "class_name": "cell phone"}]
        students = [
            {"id": 1, "box": [0, 100, 80, 180]},
            {"id": 2, "box": [140, 100, 220, 180]}
        ]
        
        linked = link_objects_to_students(objects, students, max_distance=200)
        self.assertEqual(linked[0]["assigned_student_id"], "ambiguous")
        self.assertEqual(linked[0]["association_confidence"], 0.0)

if __name__ == "__main__":
    unittest.main()

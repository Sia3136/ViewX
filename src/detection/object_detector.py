"""
object_detector.py

This module contains the baseline object detection logic for prohibited items
such as mobile phones and paper/chits (using 'book' as a proxy).
"""

from ultralytics import YOLO

class ProhibitedObjectDetector:
    def __init__(self, model_path="yolov8s.pt"):
        """
        Initialize the YOLO object detection model.
        Using YOLOv8 small (yolov8s.pt) by default for baseline detection.
        """
        self.model = YOLO(model_path)
        
        # COCO Classes of interest:
        # 67: 'cell phone'
        # 73: 'book' (used as a proxy for paper/chit)
        self.target_classes = [67, 73]
        
    def detect_objects(self, frame, conf_threshold=0.25):
        """
        Run object detection on a given frame and filter for prohibited items.
        
        Args:
            frame: The image frame (numpy array).
            conf_threshold: Confidence threshold for detection.
            
        Returns:
            list of dict: A list containing detected objects with their 
                          bounding box, confidence, and class name.
        """
        # Run inference, filtering only for target classes
        results = self.model(frame, classes=self.target_classes, conf=conf_threshold, verbose=False)
        
        detected_items = []
        
        if len(results) > 0:
            result = results[0]
            if result.boxes is not None:
                boxes = result.boxes.xyxy.cpu().numpy()
                confs = result.boxes.conf.cpu().numpy()
                cls_ids = result.boxes.cls.int().cpu().numpy()
                
                for box, conf, cls_id in zip(boxes, confs, cls_ids):
                    class_name = self.model.names[cls_id]
                    detected_items.append({
                        "box": [int(x) for x in box],
                        "confidence": float(conf),
                        "class_id": int(cls_id),
                        "class_name": class_name
                    })
                    
        return detected_items

import math

def link_objects_to_students(detected_objects, students_data, max_distance=150.0):
    """
    Links detected prohibited objects to the nearest student based on bounding box proximity.
    
    Args:
        detected_objects (list): List of detected objects (each is a dict with 'box', 'confidence', 'class_name').
        students_data (list): List of students (each is a dict with 'id' and 'box').
        max_distance (float): Maximum allowed pixel distance to associate an object to a student.
        
    Returns:
        list: The detected_objects list augmented with 'assigned_student_id' and 'association_confidence'.
    """
    linked_objects = []
    
    for obj in detected_objects:
        obj_x1, obj_y1, obj_x2, obj_y2 = obj['box']
        obj_center = ((obj_x1 + obj_x2) / 2.0, (obj_y1 + obj_y2) / 2.0)
        
        nearest_student = None
        min_distance = float('inf')
        
        for student in students_data:
            sx1, sy1, sx2, sy2 = student['box']
            
            # Check if object center is inside student's bounding box
            is_inside = (sx1 <= obj_center[0] <= sx2) and (sy1 <= obj_center[1] <= sy2)
            
            if is_inside:
                distance = 0.0
            else:
                # Calculate distance from object center to student center
                stu_center = ((sx1 + sx2) / 2.0, (sy1 + sy2) / 2.0)
                distance = math.hypot(obj_center[0] - stu_center[0], obj_center[1] - stu_center[1])
            
            if distance < min_distance:
                min_distance = distance
                nearest_student = student['id']
                
        # Assign if within reasonable distance
        if nearest_student is not None and min_distance <= max_distance:
            assoc_conf = 1.0 if min_distance == 0 else max(0.0, 1.0 - (min_distance / max_distance))
            assigned_id = nearest_student
        else:
            assoc_conf = 0.0
            assigned_id = "unassigned"
            
        linked_obj = obj.copy()
        linked_obj['assigned_student_id'] = assigned_id
        linked_obj['association_confidence'] = round(assoc_conf, 2)
        linked_objects.append(linked_obj)
        
    return linked_objects

"""
object_detector.py

This module contains the baseline object detection logic for prohibited items
such as mobile phones and paper/chits (using 'book' as a proxy).
"""

from ultralytics import YOLO
import math

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
        results = self.model(
            frame,
            classes=self.target_classes,
            conf=conf_threshold,
            imgsz=1280,
            verbose=False
)
        
        detected_items = []
        
        if len(results) > 0:
            result = results[0]
            if result.boxes is not None:
                boxes = result.boxes.xyxy.cpu().numpy()
                confs = result.boxes.conf.cpu().numpy()
                cls_ids = result.boxes.cls.int().cpu().numpy()
                
                for box, conf, cls_id in zip(boxes, confs, cls_ids):
                    class_name = self.model.names[cls_id]
                    x1, y1, x2, y2 = box
                    width = x2 - x1
                    height = y2 - y1
                    area = width * height
                    aspect_ratio = width / height if height > 0 else 0
                    if class_name == "cell phone":
                        # Reject if too big (likely mouse or other object) or weird shape
                        if area > 8000:          # adjust if needed
                            continue
                        if aspect_ratio < 0.4 or aspect_ratio > 2.5:
                            continue
                        if conf < 0.30:          # extra confidence check for phone
                            continue

                    # Filter for book (paper/chit proxy)
                    if class_name == "book":
                        if area < 500:           # too small
                            continue

                    detected_items.append({
                        "box": [int(x) for x in box],
                        "confidence": float(conf),
                        "class_id": int(cls_id),
                        "class_name": class_name
                    })
                    
        return detected_items

def get_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)
    
    if interArea == 0:
        return 0.0
        
    boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
    boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)
    
    iou = interArea / float(boxAArea + boxBArea - interArea)
    return iou

def link_objects_to_students(detected_objects, students_data, max_distance=150.0):
    """
    Links detected prohibited objects to the nearest student using a tiered approach:
    1. Bounding-box overlap (Strong)
    2. Wrist/hand proximity (Medium)
    3. Center distance (Weak)
    """
    linked_objects = []
    
    for obj in detected_objects:
        obj_box = obj['box']
        obj_center = ((obj_box[0] + obj_box[2]) / 2.0, (obj_box[1] + obj_box[3]) / 2.0)
        
        candidates = []
        
        for student in students_data:
            stu_box = student['box']
            iou = get_iou(obj_box, stu_box)
            
            is_overlapping = iou > 0
            
            lw = student.get('left_hand', (0,0))
            rw = student.get('right_hand', (0,0))
            
            dist_l = math.hypot(obj_center[0] - lw[0], obj_center[1] - lw[1]) if lw != (0,0) else float('inf')
            dist_r = math.hypot(obj_center[0] - rw[0], obj_center[1] - rw[1]) if rw != (0,0) else float('inf')
            min_hand_dist = min(dist_l, dist_r)
            
            stu_center = ((stu_box[0] + stu_box[2]) / 2.0, (stu_box[1] + stu_box[3]) / 2.0)
            center_dist = math.hypot(obj_center[0] - stu_center[0], obj_center[1] - stu_center[1])
            
            confidence = 0.0
            
            if is_overlapping:
                confidence = 0.9 + (0.1 * iou)
            elif min_hand_dist < 50.0:
                confidence = 0.7 + (0.2 * (1 - (min_hand_dist / 50.0)))
            elif center_dist < max_distance:
                confidence = 0.4 + (0.2 * (1 - (center_dist / max_distance)))
                
            if confidence >= 0.5:
                candidates.append({
                    "id": student['id'],
                    "confidence": confidence
                })
                
        assigned_id = "unassigned"
        assoc_conf = 0.0
        
        if len(candidates) == 1:
            assigned_id = candidates[0]['id']
            assoc_conf = candidates[0]['confidence']
        elif len(candidates) > 1:
            candidates.sort(key=lambda x: x['confidence'], reverse=True)
            
            top_cand = candidates[0]
            runner_up = candidates[1]
            
            if (top_cand['confidence'] - runner_up['confidence']) < 0.15:
                assigned_id = "ambiguous"
                assoc_conf = 0.0
            else:
                assigned_id = top_cand['id']
                assoc_conf = top_cand['confidence']
                
        linked_obj = obj.copy()
        linked_obj['assigned_student_id'] = assigned_id
        linked_obj['association_confidence'] = round(assoc_conf, 2)
        linked_objects.append(linked_obj)
        
    return linked_objects

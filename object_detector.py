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

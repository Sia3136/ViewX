"""
behaviour.py

This module defines the rule-based Behavior Analysis Engine.
It contains measurable definitions, thresholds, and detector functions
for suspicious behaviors during examination monitoring.
"""

import math

# ==============================================================================
# 1. BEHAVIOR DEFINITIONS & THRESHOLDS
# ==============================================================================

class BehaviorThresholds:
    # --------------------------------------------------------------------------
    # Repeated Sideward Glances
    # --------------------------------------------------------------------------
    HEAD_YAW_OFFSET_THRESHOLD = 20.0
    HEAD_TURN_MIN_DURATION = 2.0
    HEAD_GLANCE_WINDOW = 10.0
    HEAD_GLANCE_COUNT_THRESHOLD = 3

    # --------------------------------------------------------------------------
    # Excessive Head Turning
    # --------------------------------------------------------------------------
    EXCESSIVE_TURN_WINDOW = 15.0
    EXCESSIVE_TURN_COUNT_THRESHOLD = 5

    # --------------------------------------------------------------------------
    # Body Rotation Toward Neighbouring Students
    # --------------------------------------------------------------------------
    SHOULDER_ROTATION_THRESHOLD = 15.0

    # --------------------------------------------------------------------------
    # Unusual / Repetitive Hand Movements
    # --------------------------------------------------------------------------
    HAND_MOVEMENT_THRESHOLD = 40.0
    HAND_MOVEMENT_MIN_DURATION = 3.0

    # --------------------------------------------------------------------------
    # Possible Non-Verbal Communication Attempts
    # --------------------------------------------------------------------------
    HAND_TO_FACE_DISTANCE_THRESHOLD = 30.0
    HAND_TO_FACE_MIN_DURATION = 2.0


# ==============================================================================
# 2. BEHAVIOR ENGINE LOGIC
# ==============================================================================

class BehaviorEngine:
    def __init__(self):
        self.thresholds = BehaviorThresholds()
        
    def _create_alert(self, behavior_name, detected, confidence, reason):
        return {
            "behavior": behavior_name,
            "detected": detected,
            "confidence": round(confidence, 2),
            "reason": reason
        }

    def detect_sideward_glances(self, temporal_features):
        """
        Detects if the student has repeatedly glanced sideward.
        temporal_features: list of dicts with 'head_offset' and 'timestamp'
        """
        if not temporal_features:
            return self._create_alert("repeated_sideward_glance", False, 0.0, "No features available.")
            
        current_time = temporal_features[-1]['timestamp']
        window_start = current_time - self.thresholds.HEAD_GLANCE_WINDOW
        
        # Count sustained glances in the window
        glance_count = 0
        current_glance_start = None
        
        for feat in temporal_features:
            if feat['timestamp'] < window_start:
                continue
                
            is_turned = abs(feat['head_offset']) > self.thresholds.HEAD_YAW_OFFSET_THRESHOLD
            
            if is_turned:
                if current_glance_start is None:
                    current_glance_start = feat['timestamp']
                elif (feat['timestamp'] - current_glance_start) >= self.thresholds.HEAD_TURN_MIN_DURATION:
                    glance_count += 1
                    current_glance_start = None # reset for next glance
            else:
                current_glance_start = None
                
        detected = glance_count >= self.thresholds.HEAD_GLANCE_COUNT_THRESHOLD
        confidence = min(glance_count / max(1, self.thresholds.HEAD_GLANCE_COUNT_THRESHOLD), 1.0) if detected else 0.0
        
        reason = "Head orientation exceeded the defined yaw threshold for the required duration and occurred the required number of times within the rolling window." if detected else "Normal head movement."
        return self._create_alert("repeated_sideward_glance", detected, confidence, reason)

    def detect_excessive_head_turns(self, temporal_features):
        """
        Detects frequent changes in head direction (Left <-> Center <-> Right).
        temporal_features: list of dicts with 'head_orientation' and 'timestamp'
        """
        if not temporal_features:
            return self._create_alert("excessive_head_turning", False, 0.0, "No features available.")
            
        current_time = temporal_features[-1]['timestamp']
        window_start = current_time - self.thresholds.EXCESSIVE_TURN_WINDOW
        
        turn_count = 0
        last_orientation = None
        
        for feat in temporal_features:
            if feat['timestamp'] < window_start:
                continue
            
            current_orientation = feat.get('head_orientation', 'Center')
            if last_orientation is not None and current_orientation != last_orientation:
                turn_count += 1
            last_orientation = current_orientation
            
        detected = turn_count >= self.thresholds.EXCESSIVE_TURN_COUNT_THRESHOLD
        confidence = min(turn_count / max(1, self.thresholds.EXCESSIVE_TURN_COUNT_THRESHOLD), 1.0) if detected else 0.0
        
        reason = f"Detected {turn_count} head direction changes within the rolling window." if detected else "Normal head direction changes."
        return self._create_alert("excessive_head_turning", detected, confidence, reason)

    def detect_body_rotation(self, temporal_features):
        """
        Detects if the shoulder angle deviates significantly from horizontal.
        temporal_features: list of dicts with 'shoulder_angle'
        """
        if not temporal_features:
            return self._create_alert("body_rotation", False, 0.0, "No features available.")
            
        latest_feat = temporal_features[-1]
        shoulder_angle = abs(latest_feat.get('shoulder_angle', 0.0))
        
        detected = shoulder_angle > self.thresholds.SHOULDER_ROTATION_THRESHOLD
        confidence = min(shoulder_angle / (self.thresholds.SHOULDER_ROTATION_THRESHOLD * 2), 1.0) if detected else 0.0
        
        reason = f"Shoulder angle {shoulder_angle:.1f}° exceeded the allowed threshold of {self.thresholds.SHOULDER_ROTATION_THRESHOLD}°." if detected else "Normal body rotation."
        return self._create_alert("body_rotation", detected, confidence, reason)

    def detect_unusual_hand_movements(self, temporal_features):
        """
        Detects rapid or large hand keypoint displacement sustained over time.
        temporal_features: list of dicts with 'hand_movement' (displacement) and 'timestamp'
        """
        if not temporal_features:
            return self._create_alert("unusual_hand_movement", False, 0.0, "No features available.")
            
        movement_start = None
        sustained = False
        
        for feat in temporal_features:
            movement = feat.get('hand_movement', 0.0)
            if movement > self.thresholds.HAND_MOVEMENT_THRESHOLD:
                if movement_start is None:
                    movement_start = feat['timestamp']
                elif (feat['timestamp'] - movement_start) >= self.thresholds.HAND_MOVEMENT_MIN_DURATION:
                    sustained = True
                    break
            else:
                movement_start = None
                
        confidence = 0.85 if sustained else 0.0
        reason = "Hand movement exceeded threshold continuously for the required duration." if sustained else "Normal hand movement."
        
        return self._create_alert("unusual_hand_movement", sustained, confidence, reason)

    def detect_nonverbal_communication(self, temporal_features):
        """
        Detects hands (wrists) located in close proximity to the face (nose/ears).
        temporal_features: list of dicts with 'left_hand', 'right_hand', 'nose', 'timestamp'
        """
        if not temporal_features:
            return self._create_alert("nonverbal_communication", False, 0.0, "No features available.")
            
        proximity_start = None
        sustained = False
        
        for feat in temporal_features:
            nose = feat.get('nose', (0,0))
            lw = feat.get('left_hand', (0,0))
            rw = feat.get('right_hand', (0,0))
            
            # Simple euclidean distance
            dist_l = math.hypot(lw[0]-nose[0], lw[1]-nose[1]) if lw != (0,0) else float('inf')
            dist_r = math.hypot(rw[0]-nose[0], rw[1]-nose[1]) if rw != (0,0) else float('inf')
            
            if min(dist_l, dist_r) < self.thresholds.HAND_TO_FACE_DISTANCE_THRESHOLD:
                if proximity_start is None:
                    proximity_start = feat['timestamp']
                elif (feat['timestamp'] - proximity_start) >= self.thresholds.HAND_TO_FACE_MIN_DURATION:
                    sustained = True
                    break
            else:
                proximity_start = None
                
        confidence = 0.90 if sustained else 0.0
        reason = "Hands detected in close proximity to the face for a sustained duration." if sustained else "Normal hand position."
        
        return self._create_alert("nonverbal_communication", sustained, confidence, reason)

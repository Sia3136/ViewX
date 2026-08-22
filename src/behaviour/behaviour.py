"""
behaviour.py

This module defines the rule-based Behavior Analysis Engine.
It contains measurable definitions, thresholds, and detector functions
for suspicious behaviors during examination monitoring, enhanced with
normal behavior filters and normalized pose measurements.
"""

import math

# ==============================================================================
# 1. BEHAVIOR DEFINITIONS & THRESHOLDS
# ==============================================================================

class BehaviorThresholds:
    def __init__(self):
        # Repeated Sideward Glances
        self.HEAD_YAW_OFFSET_THRESHOLD = 20.0
        self.HEAD_TURN_MIN_DURATION = 1.5
        self.HEAD_GLANCE_WINDOW = 10.0
        self.HEAD_GLANCE_COUNT_THRESHOLD = 3

        # Excessive Head Turning
        self.EXCESSIVE_TURN_WINDOW = 15.0
        self.EXCESSIVE_TURN_COUNT_THRESHOLD = 5

        # Body Rotation Toward Neighbouring Students
        self.SHOULDER_ROTATION_THRESHOLD = 15.0
        self.BODY_ROTATION_MIN_DURATION = 3.0

        # Unusual / Repetitive Hand Movements
        self.HAND_MOVEMENT_NORMALIZED_THRESHOLD = 0.15  # displacement / shoulder_width
        self.HAND_MOVEMENT_MIN_DURATION = 3.0

        # Possible Non-Verbal Communication Attempts
        self.HAND_TO_FACE_NORMALIZED_THRESHOLD = 0.5  # distance / shoulder_width
        self.HAND_TO_FACE_MIN_DURATION = 2.0

    def update_from_dict(self, settings_dict):
        """Updates threshold values from a dictionary (e.g. from DB settings)."""
        mapping = {
            "glance_yaw_threshold": ("HEAD_YAW_OFFSET_THRESHOLD", float),
            "glance_min_duration": ("HEAD_TURN_MIN_DURATION", float),
            "glance_window": ("HEAD_GLANCE_WINDOW", float),
            "glance_count": ("HEAD_GLANCE_COUNT_THRESHOLD", int),
            "turn_window": ("EXCESSIVE_TURN_WINDOW", float),
            "turn_count": ("EXCESSIVE_TURN_COUNT_THRESHOLD", int),
            "shoulder_rotation_threshold": ("SHOULDER_ROTATION_THRESHOLD", float),
            "body_rotation_duration": ("BODY_ROTATION_MIN_DURATION", float),
            "hand_movement_threshold": ("HAND_MOVEMENT_NORMALIZED_THRESHOLD", float),
            "hand_movement_duration": ("HAND_MOVEMENT_MIN_DURATION", float),
            "hand_face_threshold": ("HAND_TO_FACE_NORMALIZED_THRESHOLD", float),
            "hand_face_duration": ("HAND_TO_FACE_MIN_DURATION", float),
        }
        for key, (attr_name, type_func) in mapping.items():
            if key in settings_dict:
                try:
                    setattr(self, attr_name, type_func(settings_dict[key]))
                except ValueError:
                    pass

# ==============================================================================
# 2. BEHAVIOR ENGINE LOGIC
# ==============================================================================

class BehaviorEngine:
    def __init__(self):
        self.thresholds = BehaviorThresholds()
        
    def update_thresholds(self, settings_dict):
        self.thresholds.update_from_dict(settings_dict)

    def _create_alert(self, behavior_name, detected, confidence, reason, normal_behaviour=None):
        return {
            "behavior": behavior_name,
            "detected": detected,
            "confidence": round(confidence, 2),
            "reason": reason,
            "normal_behaviour": normal_behaviour
        }

    def _get_shoulder_width(self, feat):
        ls = feat.get('left_shoulder', (0, 0))
        rs = feat.get('right_shoulder', (0, 0))
        if ls == (0,0) or rs == (0,0):
            # Fallback to bbox width
            box = feat.get('box', [0,0,100,100])
            return max(box[2] - box[0], 50.0)
        dist = math.hypot(ls[0] - rs[0], ls[1] - rs[1])
        return max(dist, 50.0) # prevent div by zero

    def _is_looking_down(self, feat):
        """
        Heuristic: Nose drops close to or below the shoulder line.
        """
        nose_y = feat.get('nose', (0, 0))[1]
        ls = feat.get('left_shoulder', (0, 0))
        rs = feat.get('right_shoulder', (0, 0))
        
        if ls == (0,0) or rs == (0,0):
            return False
            
        shoulder_y = (ls[1] + rs[1]) / 2.0
        shoulder_width = self._get_shoulder_width(feat)
        
        # dist is positive if nose is above shoulders (y decreases upwards)
        dist = shoulder_y - nose_y 
        
        # If nose is very close to or below shoulders
        return dist < (0.2 * shoulder_width)

    def _is_stretching(self, feat):
        """
        Heuristic: Both wrists are significantly elevated above the shoulders and head.
        """
        lw_y = feat.get('left_hand', (0,0))[1]
        rw_y = feat.get('right_hand', (0,0))[1]
        nose_y = feat.get('nose', (0,0))[1]
        ls_y = feat.get('left_shoulder', (0, 0))[1]
        
        if lw_y == 0 or rw_y == 0:
            return False
            
        # smaller y is higher in the image
        return (lw_y < nose_y) and (rw_y < nose_y) and (lw_y < ls_y) and (rw_y < ls_y)

    def _is_writing(self, feat):
        """
        Heuristic: Hands are below shoulders, and person is looking down.
        """
        lw_y = feat.get('left_hand', (0,0))[1]
        rw_y = feat.get('right_hand', (0,0))[1]
        ls_y = feat.get('left_shoulder', (0, 0))[1]
        rs_y = feat.get('right_shoulder', (0, 0))[1]
        
        if lw_y == 0 or rw_y == 0:
            return False
            
        shoulder_y = (ls_y + rs_y) / 2.0
        
        return (lw_y > shoulder_y) and (rw_y > shoulder_y) and self._is_looking_down(feat)

    # --------------------------------------------------------------------------
    # DETECTORS
    # --------------------------------------------------------------------------

    def detect_sideward_glances(self, temporal_features):
        if not temporal_features:
            return self._create_alert("repeated_sideward_glance", False, 0.0, "No features available.")
            
        current_time = temporal_features[-1]['timestamp']
        window_start = current_time - self.thresholds.HEAD_GLANCE_WINDOW
        
        glance_count = 0
        current_glance_start = None
        
        looking_down_count = 0
        valid_frames = 0
        
        for feat in temporal_features:
            if feat['timestamp'] < window_start:
                continue
                
            valid_frames += 1
            if self._is_looking_down(feat):
                looking_down_count += 1
                
            is_turned = abs(feat.get('head_offset', 0)) > self.thresholds.HEAD_YAW_OFFSET_THRESHOLD
            
            if is_turned:
                if current_glance_start is None:
                    current_glance_start = feat['timestamp']
                elif (feat['timestamp'] - current_glance_start) >= self.thresholds.HEAD_TURN_MIN_DURATION:
                    glance_count += 1
                    current_glance_start = None # reset for next glance
            else:
                current_glance_start = None
                
        is_mostly_looking_down = (looking_down_count / max(1, valid_frames)) > 0.6 if valid_frames > 0 else False
        
        # Require stronger evidence if mostly looking down
        required_count = self.thresholds.HEAD_GLANCE_COUNT_THRESHOLD
        if is_mostly_looking_down:
            required_count += 1
            
        detected = glance_count >= required_count
        confidence = min(glance_count / max(1, required_count), 1.0) if detected else 0.0
        
        if detected and is_mostly_looking_down:
            confidence *= 0.7 # Reduce confidence
            if confidence < 0.5:
                detected = False
            
        reason = f"Repeated sideward head orientation ({glance_count} glances) exceeded temporal thresholds." if detected else "Normal head movement."
        norm_beh = "looking_down" if is_mostly_looking_down else None
        
        return self._create_alert("repeated_sideward_glance", detected, confidence, reason, norm_beh)

    def detect_excessive_head_turns(self, temporal_features):
        if not temporal_features:
            return self._create_alert("excessive_head_turning", False, 0.0, "No features available.")
            
        current_time = temporal_features[-1]['timestamp']
        window_start = current_time - self.thresholds.EXCESSIVE_TURN_WINDOW
        
        turn_count = 0
        last_orientation = None
        looking_down_count = 0
        valid_frames = 0
        
        for feat in temporal_features:
            if feat['timestamp'] < window_start:
                continue
                
            valid_frames += 1
            if self._is_looking_down(feat):
                looking_down_count += 1
            
            current_orientation = feat.get('head_orientation', 'Center')
            if last_orientation is not None and current_orientation != last_orientation:
                turn_count += 1
            last_orientation = current_orientation
            
        is_mostly_looking_down = (looking_down_count / max(1, valid_frames)) > 0.6 if valid_frames > 0 else False
        
        required_count = self.thresholds.EXCESSIVE_TURN_COUNT_THRESHOLD
        if is_mostly_looking_down:
            required_count += 2
            
        detected = turn_count >= required_count
        confidence = min(turn_count / max(1, required_count), 1.0) if detected else 0.0
        
        if detected and is_mostly_looking_down:
            confidence *= 0.7
            if confidence < 0.5:
                detected = False
            
        reason = f"Detected {turn_count} head direction changes within the rolling window." if detected else "Normal head direction changes."
        norm_beh = "looking_down" if is_mostly_looking_down else None
        
        return self._create_alert("excessive_head_turning", detected, confidence, reason, norm_beh)

    def detect_body_rotation(self, temporal_features):
        if not temporal_features:
            return self._create_alert("body_rotation", False, 0.0, "No features available.")
            
        current_time = temporal_features[-1]['timestamp']
        window_start = current_time - self.thresholds.BODY_ROTATION_MIN_DURATION
        
        # We need sustained rotation for the entire duration
        sustained = True
        has_data = False
        looking_down_count = 0
        valid_frames = 0
        
        for feat in temporal_features:
            if feat['timestamp'] < window_start:
                continue
                
            has_data = True
            valid_frames += 1
            if self._is_looking_down(feat):
                looking_down_count += 1
                
            shoulder_angle = abs(feat.get('shoulder_angle', 0.0))
            if shoulder_angle <= self.thresholds.SHOULDER_ROTATION_THRESHOLD:
                sustained = False
                break
                
        is_mostly_looking_down = (looking_down_count / max(1, valid_frames)) > 0.6 if valid_frames > 0 else False
        
        detected = sustained and has_data
        confidence = 0.9 if detected else 0.0
        
        if detected and is_mostly_looking_down:
            # Looking down often warps shoulder angle calculation
            confidence *= 0.5
            if confidence < 0.5:
                detected = False
        
        shoulder_angle = abs(temporal_features[-1].get('shoulder_angle', 0.0))
        reason = f"Shoulder angle {shoulder_angle:.1f}° exceeded threshold continuously." if detected else "Normal body rotation."
        norm_beh = "looking_down" if is_mostly_looking_down else None
        
        return self._create_alert("body_rotation", detected, confidence, reason, norm_beh)

    def detect_unusual_hand_movements(self, temporal_features):
        if not temporal_features:
            return self._create_alert("unusual_hand_movement", False, 0.0, "No features available.")
            
        movement_start = None
        sustained = False
        
        stretch_count = 0
        write_count = 0
        valid_frames = 0
        
        for feat in temporal_features:
            # Normalize hand movement by shoulder width
            shoulder_width = self._get_shoulder_width(feat)
            raw_movement = feat.get('hand_movement', 0.0)
            norm_movement = raw_movement / shoulder_width if shoulder_width > 0 else 0.0
            
            valid_frames += 1
            if self._is_stretching(feat):
                stretch_count += 1
            if self._is_writing(feat):
                write_count += 1
                
            if norm_movement > self.thresholds.HAND_MOVEMENT_NORMALIZED_THRESHOLD:
                if movement_start is None:
                    movement_start = feat['timestamp']
                elif (feat['timestamp'] - movement_start) >= self.thresholds.HAND_MOVEMENT_MIN_DURATION:
                    sustained = True
            else:
                movement_start = None
                
        is_stretching = (stretch_count / max(1, valid_frames)) > 0.4 if valid_frames > 0 else False
        is_writing = (write_count / max(1, valid_frames)) > 0.6 if valid_frames > 0 else False
        
        detected = sustained
        confidence = 0.85 if detected else 0.0
        norm_beh = None
        
        if detected:
            if is_stretching:
                detected = False # Stretching fully suppresses this
                confidence = 0.0
                norm_beh = "stretching"
            elif is_writing:
                confidence *= 0.5 # Writing reduces confidence significantly
                if confidence < 0.5:
                    detected = False
                norm_beh = "writing"
                
        reason = "Hand movement exceeded threshold continuously for the required duration." if detected else "Normal hand movement."
        
        return self._create_alert("unusual_hand_movement", detected, confidence, reason, norm_beh)

    def detect_nonverbal_communication(self, temporal_features):
        if not temporal_features:
            return self._create_alert("nonverbal_communication", False, 0.0, "No features available.")
            
        proximity_start = None
        sustained = False
        turned_while_hand_near = 0
        stretch_count = 0
        valid_frames = 0
        
        for feat in temporal_features:
            nose = feat.get('nose', (0,0))
            lw = feat.get('left_hand', (0,0))
            rw = feat.get('right_hand', (0,0))
            shoulder_width = self._get_shoulder_width(feat)
            
            valid_frames += 1
            if self._is_stretching(feat):
                stretch_count += 1
            
            dist_l = math.hypot(lw[0]-nose[0], lw[1]-nose[1]) if lw != (0,0) else float('inf')
            dist_r = math.hypot(rw[0]-nose[0], rw[1]-nose[1]) if rw != (0,0) else float('inf')
            
            min_dist = min(dist_l, dist_r)
            norm_dist = min_dist / shoulder_width if shoulder_width > 0 else float('inf')
            
            if norm_dist < self.thresholds.HAND_TO_FACE_NORMALIZED_THRESHOLD:
                if proximity_start is None:
                    proximity_start = feat['timestamp']
                elif (feat['timestamp'] - proximity_start) >= self.thresholds.HAND_TO_FACE_MIN_DURATION:
                    sustained = True
            else:
                proximity_start = None
                
        is_stretching = (stretch_count / max(1, valid_frames)) > 0.5 if valid_frames > 0 else False
        
        detected = sustained
        confidence = 0.90 if detected else 0.0
        norm_beh = None
        
        if detected and is_stretching:
            detected = False
            confidence = 0.0
            norm_beh = "stretching"
            
        reason = "Hands detected in close proximity to the face for a sustained duration." if detected else "Normal hand position."
        
        return self._create_alert("nonverbal_communication", detected, confidence, reason, norm_beh)

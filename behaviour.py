"""
behaviour.py

This module defines the rule-based Behavior Analysis Engine.
It contains measurable definitions and thresholds for suspicious behaviors
during examination monitoring.
"""

# ==============================================================================
# 1. BEHAVIOR DEFINITIONS & THRESHOLDS
# ==============================================================================

class BehaviorThresholds:
    # --------------------------------------------------------------------------
    # Repeated Sideward Glances
    # Definition: Head orientation offset > threshold for a sustained period, 
    #             occurring multiple times within a rolling window.
    # --------------------------------------------------------------------------
    HEAD_YAW_OFFSET_THRESHOLD = 20        # Pixels or degree proxy offset for left/right
    HEAD_TURN_MIN_DURATION = 2.0          # Minimum seconds the head must remain turned
    HEAD_GLANCE_WINDOW = 10.0             # Rolling window in seconds to count glances
    HEAD_GLANCE_COUNT_THRESHOLD = 3       # Number of glances within the window to flag

    # --------------------------------------------------------------------------
    # Excessive Head Turning
    # Definition: Frequent changes in head direction (Left <-> Center <-> Right)
    # --------------------------------------------------------------------------
    EXCESSIVE_TURN_WINDOW = 15.0          # Rolling window in seconds
    EXCESSIVE_TURN_COUNT_THRESHOLD = 5    # Number of direction changes to flag

    # --------------------------------------------------------------------------
    # Body Rotation Toward Neighbouring Students
    # Definition: Shoulder angle deviates significantly from the horizontal axis.
    # --------------------------------------------------------------------------
    SHOULDER_ROTATION_THRESHOLD = 15.0    # Degrees from horizontal (arctan of dy/dx)

    # --------------------------------------------------------------------------
    # Unusual / Repetitive Hand Movements
    # Definition: Rapid or large hand keypoint displacement sustained over time.
    # --------------------------------------------------------------------------
    HAND_MOVEMENT_THRESHOLD = 40.0        # Euclidean distance displacement threshold (pixels)
    HAND_MOVEMENT_MIN_DURATION = 3.0      # Minimum seconds continuous movement is observed

    # --------------------------------------------------------------------------
    # Possible Non-Verbal Communication Attempts
    # Definition: Hands (wrists) located in close proximity to the face (nose/ears).
    # --------------------------------------------------------------------------
    HAND_TO_FACE_DISTANCE_THRESHOLD = 30.0 # Pixel distance between wrist and face keypoint
    HAND_TO_FACE_MIN_DURATION = 2.0        # Minimum seconds sustained near face

    # --------------------------------------------------------------------------
    # Whispering / Lip Movements
    # Definition: Continuous opening and closing of mouth/lips.
    # --------------------------------------------------------------------------
    LIP_MOVEMENT_THRESHOLD = 0.05         # MAR (Mouth Aspect Ratio) variance threshold
    LIP_MOVEMENT_MIN_DURATION = 2.0       # Minimum seconds of continuous lip movement

    # --------------------------------------------------------------------------
    # Eye Movements (Peeking / Glancing)
    # Definition: Frequent eye gaze shifting without full head rotation.
    # --------------------------------------------------------------------------
    EYE_GAZE_THRESHOLD = 0.20             # EAR (Eye Aspect Ratio) or pupil variance
    EYE_GLANCE_WINDOW = 10.0              # Rolling window for eye glances
    EYE_GLANCE_COUNT_THRESHOLD = 4        # Number of rapid eye movements to flag

# ==============================================================================
# 2. BEHAVIOR ENGINE LOGIC (Placeholder for Day 2)
# ==============================================================================
# Functions to process temporal features against these thresholds will be added here.

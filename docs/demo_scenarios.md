# Demo Scenarios for Drishti AI

This document provides clear, narrative examples of how the Drishti AI rule engine processes both normal and suspicious behaviours. These scenarios are designed to be presented during demos to illustrate the system's robustness against false positives and its temporal persistence tracking.

You can run these scenarios interactively using the synthetic simulator:
```bash
python -m tests.integration.demo_simulator
```

---

## 1. Normal Writing (False Positive Suppression)

**The Challenge:** A student actively writing in an exam will constantly move their hands. A naive AI invigilator might flag this as "Unusual Hand Movement".
**Our Approach:** The rule engine evaluates the contextual pose. It detects that:
1. The student is looking down (nose Y-coordinate is near the shoulder line).
2. Both hands are constrained within a tight vertical region below the shoulders.
**Result:** The system classifies this as `writing` and explicitly suppresses the hand-movement alert, preventing false positives.

## 2. Stretching (False Positive Suppression)

**The Challenge:** A student stretching during a long exam causes massive keypoint displacement, normally triggering movement or communication alerts.
**Our Approach:** The rule engine identifies a classic stretch by confirming that both left and right wrists have elevated significantly above the nose and shoulder line. 
**Result:** The system classifies this as `stretching` and suppresses any overlapping hand-movement or face-proximity alerts.

## 3. Brief Side Glance (Temporal Robustness)

**The Challenge:** Students occasionally look away from their paper momentarily. Firing an alert for a single 2-second glance creates anxiety and spam.
**Our Approach:** The engine uses a rolling 10-second window. It tracks head yaw offset. A single glance is recorded, but it does not meet the threshold (e.g., 3 separate glances).
**Result:** No alert is triggered. The engine logs "Normal head movement."

## 4. Repeated Sideward Glances (True Positive Detection)

**The Challenge:** A student repeatedly looks over at their neighbour's paper.
**Our Approach:** Over the 10-second rolling window, the engine observes the head yaw exceeding the 20° threshold for more than 1.5 seconds on three separate occasions.
**Result:** The engine triggers a `repeated_sideward_glance` alert with high confidence (1.00) and the explicit reason: "Repeated sideward head orientation (3 glances) exceeded temporal thresholds."

## 5. Mobile Phone Detection & Student Association (True Positive)

**The Challenge:** A mobile phone is detected on a desk, but the system needs to know which student it belongs to without arbitrary assignments.
**Our Approach:** The object association module uses a tiered confidence system:
- **Strong:** The object's bounding box intersects with the student's bounding box.
- **Medium:** The object is within 50 pixels of the student's hands.
- **Weak:** The object is merely near the student's center.
**Result:** In the demo, a cell phone intersects heavily with Student 42's bounding box. The system assigns the phone to Student 42 with 0.90+ confidence, triggering a specific prohibited-object alert rather than a generic room-wide warning. If the phone was exactly between two students, the system would mark it as `ambiguous` and refuse to falsely accuse either student.

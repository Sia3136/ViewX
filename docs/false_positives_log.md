# False Positives Log & Rationale

This document logs the major false positive challenges encountered during the development of Drishti AI, and the technical rationale behind the filters implemented in Day 4 to solve them.

| Activity Description | Incorrectly Triggered Rule | Trigger Features | Day 4 Filter Implementation & Rationale | Sample ID |
|----------------------|---------------------------|------------------|-----------------------------------------|-----------|
| Normal writing/reading (hand resting or moving fast below shoulders) | `unusual_hand_movement` | High hand displacement | **Contextual Modifier:** `_is_writing()` checks if hands are below shoulders AND nose is close to shoulder line. If active, confidence is halved. | FP_001 |
| Stretching in chair | `unusual_hand_movement` / `nonverbal_communication` | Wrists move far or approach head rapidly | **Contextual Modifier:** `_is_stretching()` checks if wrists are elevated significantly above the nose. Suppresses these alerts completely. | FP_002 |
| Looking down at paper/writing | `repeated_sideward_glance` / `excessive_head_turning` | Head offset changes as pitch/yaw interact | **Contextual Modifier:** `_is_looking_down()` checks vertical distance between nose and shoulders. If active, increases required glance count by +1 or +2. | FP_003 |
| Brief normal interaction (adjusting glasses, etc) | `nonverbal_communication` | Hands near face | **Temporal Gate:** Requires distance to remain under threshold continuously for > 2.0s. | FP_004 |
| Scale variance for distance/movement metrics across rows | All distance-based alerts | Hard-coded pixel thresholds failed for students far from camera | **Dynamic Normalization:** All spatial thresholds are now divided by the student's shoulder width, resulting in scale-invariant metrics (e.g. threshold = 0.15 * shoulder_width). | FP_005 |
| Innocent looking sideways at clock or paper | `repeated_sideward_glance` | High yaw offset | **Rolling Temporal Windows:** Single glances do not trigger an alert. Requires 3+ sustained (>1.5s) glances within a 10s rolling window. | FP_006 |
| Ambiguous object association (phone between two students) | `prohibited_object` | Proximity was based on raw distance alone | **Tiered Association & Ambiguity Guard:** Uses bounding-box overlap (IoU) first, then hand proximity, then center distance. If confidence between top 2 students is < 0.15 diff, it assigns as "ambiguous". | FP_007 |

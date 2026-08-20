# False Positives Log

This log documents normal activities that may incorrectly trigger suspicious-behaviour rules. By tracking these edge cases, we can refine our thresholds and rules in Day 4.

| Activity Description | Incorrectly Triggered Rule | Trigger Features | Current Threshold/Rule | Why it is a False Positive | Proposed Future Refinement | Sample ID |
|----------------------|---------------------------|------------------|-------------------------|---------------------------|----------------------------|-----------|
| Normal thinking (hand resting on chin) | `nonverbal_communication` | Hand keypoint (wrist) detected near face | Distance < 30px for > 2s | The student is simply resting their head, not attempting to communicate | Combine with EAR/MAR (check for open mouth/talking) or head motion | FP_001 |
| Stretching in chair | `body_rotation` | Shoulder angle deviation > 15° | Shoulder angle > 15° | Natural movement over a short duration | Require sustained rotation (> 3s) or look for continuous movement | FP_002 |
| Looking down at paper/writing | `repeated_sideward_glance` / `excessive_head_turning` | Head offset changing due to downward tilt | Head yaw > 20px | Student is reading question paper or writing | Integrate pitch estimation (nose vs eyes) to identify downward look rather than sideward | FP_003 |
| Adjusting glasses | `nonverbal_communication` / `unusual_hand_movement` | Hands near face, brief rapid hand motion | Distance < 30px / Hand Movement > 40px | Quick normal adjustment | Filter out hand-to-face motions lasting < 1s | FP_004 |
| Adjusting hair | `nonverbal_communication` | Hands near face/ears | Distance < 30px | Normal grooming habit | Check if movement is continuous and short-lived | FP_005 |
| Picking up or moving a pen | `unusual_hand_movement` | Large displacement of wrist | Hand movement > 40px | Normal exam interaction | Check if movement is directed towards table surface | FP_006 |
| Briefly looking sideways at the clock | `repeated_sideward_glance` | Head yaw > 20px | Glances > 3 times in 10s | Innocent time checking | Ensure glances are clustered or sustained | FP_007 |
| Changing sitting posture | `body_rotation` / `excessive_head_turning` | Shoulder angle and head offset changes | Shoulder angle > 15° | Natural shifting for comfort | Add minimum duration to body rotation rule | FP_008 |

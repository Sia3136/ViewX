import numpy as np
from collections import defaultdict

class MultiCameraReID:
    """Global ID with full pose biometric signature"""
    
    def __init__(self, camera_positions, reid_threshold=0.85):  # higher threshold = more confident
        self.camera_positions = camera_positions
        self.reid_threshold = reid_threshold
        self.global_id_counter = 0
        self.tracks = defaultdict(list)
        self.camera_tracks = defaultdict(dict)
        self.student_biometrics = {}  # global_id -> biometric signature (averaged keypoints)
        
    def calculate_pose_similarity(self, pose1, pose2):
        """Full biometric matching using dual-triangle + all keypoints"""
        if pose1 is None or pose2 is None:
            return 0.0
        
        # YOLOv8 Pose order: 0=nose, 1=left_eye, 2=right_eye, 3=left_ear, 4=right_ear
        p1_nose = pose1[0]
        p1_le  = pose1[1]
        p1_re  = pose1[2]
        p1_la  = pose1[3]
        p1_ra  = pose1[4]
        p2_nose = pose2[0]
        p2_le  = pose2[1]
        p2_re  = pose2[2]
        p2_la  = pose2[3]
        p2_ra  = pose2[4]
        
        # Dual triangles (your exact project logic)
        yaw_le1 = np.arctan2(p1_le[1] - p1_nose[1], p1_le[0] - p1_nose[0])
        yaw_re1 = np.arctan2(p1_re[1] - p1_nose[1], p1_re[0] - p1_nose[0])
        yaw_la1 = np.arctan2(p1_la[1] - p1_nose[1], p1_la[0] - p1_nose[0])
        yaw_ra1 = np.arctan2(p1_ra[1] - p1_nose[1], p1_ra[0] - p1_nose[0])
        
        yaw_le2 = np.arctan2(p2_le[1] - p2_nose[1], p2_le[0] - p2_nose[0])
        yaw_re2 = np.arctan2(p2_re[1] - p2_nose[1], p2_re[0] - p2_nose[0])
        yaw_la2 = np.arctan2(p2_la[1] - p2_nose[1], p2_la[0] - p2_nose[0])
        yaw_ra2 = np.arctan2(p2_ra[1] - p2_nose[1], p2_ra[0] - p2_nose[0])
        
        avg_yaw1 = (yaw_le1 + yaw_re1) / 2
        avg_yaw2 = (yaw_la1 + yaw_ra1) / 2
        avg_yaw3 = (yaw_le2 + yaw_re2) / 2
        avg_yaw4 = (yaw_la2 + yaw_ra2) / 2
        
        # Centroid distance
        p1_centroid = np.mean(pose1[:, :2], axis=0)
        p2_centroid = np.mean(pose2[:, :2], axis=0)
        dist = np.linalg.norm(p1_centroid - p2_centroid)
        
        # Biometric similarity (higher = better match)
        yaw_sim = 1 - abs(avg_yaw1 - avg_yaw3) / np.pi - abs(avg_yaw2 - avg_yaw4) / np.pi
        return max(0.0, yaw_sim - dist / 100)
    
    def match_across_cameras(self, results_per_cam, frame_num):
        if len(results_per_cam) < 2:
            return []
        
        cam1_results = results_per_cam[0]
        cam2_results = results_per_cam[1]
        matches = []
        
        for r1 in cam1_results:
            for r2 in cam2_results:
                if r1.boxes.cls[0] != 0 or r2.boxes.cls[0] != 0:
                    continue
                pos1 = r1.boxes.xywh[0][:2].cpu().numpy()
                pos2 = r2.boxes.xywh[0][:2].cpu().numpy()
                if np.linalg.norm(pos1 - pos2) > 20:
                    continue
                
                pose1 = r1.boxes.data[0]
                pose2 = r2.boxes.data[0]
                
                sim = self.calculate_pose_similarity(pose1, pose2)
                if sim > self.reid_threshold:
                    matches.append((r1.track_id, r2.track_id, pose1))
        return matches

    def assign_global_ids(self, results_per_cam, frame_num):
        matches = self.match_across_cameras(results_per_cam, frame_num)
        
        for local1, local2, pose1 in matches:
            # Get/create global ID for Cam1
            cam1_id = local1
            if cam1_id in self.camera_tracks[0]:
                g1 = self.camera_tracks[0][cam1_id]
            else:
                self.global_id_counter += 1
                g1 = self.global_id_counter
                self.camera_tracks[0][cam1_id] = g1
                # Store biometric signature
                self.student_biometrics[g1] = pose1
            
            # Cam2
            cam2_id = local2
            if cam2_id in self.camera_tracks[1]:
                g2 = self.camera_tracks[1][cam2_id]
            else:
                self.global_id_counter += 1
                g2 = self.global_id_counter
                self.camera_tracks[1][cam2_id] = g2
                self.student_biometrics[g2] = pose1
            
            # Merge if different
            if g1 != g2:
                for tid in list(self.camera_tracks[0].keys()):
                    if self.camera_tracks[0][tid] == g1:
                        self.camera_tracks[0][tid] = g2
                for tid in list(self.camera_tracks[1].keys()):
                    if self.camera_tracks[1][tid] == g2:
                        self.camera_tracks[1][tid] = g1
                self.global_id_counter -= 1
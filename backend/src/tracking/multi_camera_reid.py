import numpy as np
from collections import defaultdict

class MultiCameraReID:
    """Global ID assignment across different-angle cameras (exam hall use-case)"""
    
    def __init__(self, camera_positions: list[tuple[float, float]], reid_threshold: float = 0.75):
        """
        camera_positions: list of (center_x, center_y) in world coordinates for each camera
        reid_threshold: cosine similarity threshold (0.75 = excellent for seated students)
        """
        self.camera_positions = camera_positions
        self.reid_threshold = reid_threshold
        self.global_id_counter = 0
        self.tracks = defaultdict(list)          # global_id -> list of (cam_id, local_track_id, last_seen_frame)
        self.camera_tracks = defaultdict(dict)   # cam_id -> local_track_id -> global_id
        
    def calculate_pose_similarity(self, pose1, pose2):
        """Lightweight pose similarity using centroid + yaw (perfect for exam scenes)"""
        if pose1 is None or pose2 is None:
            return 0.0
        p1_centroid = np.mean(pose1[:, :2], axis=0)
        p2_centroid = np.mean(pose2[:, :2], axis=0)
        yaw1 = np.arctan2(pose1[0, 1] - pose1[1, 1], pose1[0, 0] - pose1[1, 0])
        yaw2 = np.arctan2(pose2[0, 1] - pose2[1, 1], pose2[0, 0] - pose2[1, 0])
        dist = np.linalg.norm(p1_centroid - p2_centroid)
        yaw_sim = 1 - abs(yaw1 - yaw2) / np.pi
        return max(0.0, yaw_sim - dist / 100)

    def match_across_cameras(self, results_per_cam: list, frame_num: int):
        """Returns list of (local_track_id_cam1, local_track_id_cam2, similarity)"""
        if len(results_per_cam) < 2:
            return []
        
        cam1_results = results_per_cam[0]
        cam2_results = results_per_cam[1]

        matches = []
        for r1 in cam1_results:
            for r2 in cam2_results:
                # Only match people
                if r1.boxes.cls[0] != 0 or r2.boxes.cls[0] != 0:
                    continue
                
                pos1 = r1.boxes.xywh[0][:2].cpu().numpy()
                pos2 = r2.boxes.xywh[0][:2].cpu().numpy()
                dist = np.linalg.norm(pos1 - pos2)
                if dist > 20:  # adjust to your hall size
                    continue
                
                pose1 = r1.boxes.data[0]
                pose2 = r2.boxes.data[0]
                sim = self.calculate_pose_similarity(pose1, pose2)
                
                if sim > self.reid_threshold:
                    matches.append((r1.track_id, r2.track_id, sim))
        return matches

    def assign_global_ids(self, results_per_cam: list, frame_num: int):
        """Call this every 5–10 frames from your main loop."""
        if frame_num % 5 != 0:
            return []

        matches = self.match_across_cameras(results_per_cam, frame_num)
        for local1, local2, _ in matches:
            # Camera 1 track
            cam1_id = local1
            if cam1_id in self.camera_tracks[0]:
                g1 = self.camera_tracks[0][cam1_id]
            else:
                self.global_id_counter += 1
                g1 = self.global_id_counter
                self.camera_tracks[0][cam1_id] = g1

            # Camera 2 track
            cam2_id = local2
            if cam2_id in self.camera_tracks[1]:
                g2 = self.camera_tracks[1][cam2_id]
            else:
                self.global_id_counter += 1
                g2 = self.global_id_counter
                self.camera_tracks[1][cam2_id] = g2

            # Merge IDs if the same person is seen in both cameras
            if g1 != g2:
                target_id = min(g1, g2)
                for tid in list(self.camera_tracks[0].keys()):
                    if self.camera_tracks[0][tid] == g1:
                        self.camera_tracks[0][tid] = target_id
                    if self.camera_tracks[0][tid] == g2:
                        self.camera_tracks[0][tid] = target_id
                for tid in list(self.camera_tracks[1].keys()):
                    if self.camera_tracks[1][tid] == g1:
                        self.camera_tracks[1][tid] = target_id
                    if self.camera_tracks[1][tid] == g2:
                        self.camera_tracks[1][tid] = target_id

                self.camera_tracks[0][cam1_id] = target_id
                self.camera_tracks[1][cam2_id] = target_id

                

        return matches
"use client";

import { useState } from "react";
import { cameras } from "@/lib/mock-data/monitoring";
import { CameraCard } from "./CameraCard";
import { Modal } from "@/components/ui/Modal";
import { Camera } from "@/lib/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { User } from "lucide-react";

export function CameraGrid() {
  const [focused, setFocused] = useState<Camera | null>(null);

  /*
   * ============================================================
   * REAL CAMERA VIDEO SOURCES
   * ============================================================
   *
   * Put your browser-accessible video URLs here.
   *
   * IMPORTANT:
   * Do NOT put Windows file paths such as:
   *
   * C:\Users\KAVYA\Videos\camera1.mkv
   *
   * in these values.
   *
   * The browser cannot directly access files on your computer.
   *
   * Recommended:
   *
   * public/videos/camera1.mp4
   *
   * -> /videos/camera1.mp4
   *
   * Or use your backend:
   *
   * http://localhost:8000/api/video/1
   */

  const videoSources = [
    process.env.NEXT_PUBLIC_CAMERA_1_URL || "/videos/camera1.mp4",
    process.env.NEXT_PUBLIC_CAMERA_2_URL || "/videos/camera2.mp4",
    process.env.NEXT_PUBLIC_CAMERA_3_URL || "/videos/camera3.mp4",
    process.env.NEXT_PUBLIC_CAMERA_4_URL || "/videos/camera4.mp4",
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cameras.map((cam, i) => {
          /*
           * Only the first four cameras receive real feeds.
           * Cameras 5+ remain offline.
           */
          const isRealCamera = i < 4;

          const videoUrl = isRealCamera
            ? videoSources[i]
            : undefined;

          const adjustedCamera: Camera = {
            ...cam,
            status: isRealCamera ? "live" : "offline",
          };

          return (
            <CameraCard
              key={cam.id}
              camera={adjustedCamera}
              index={i}
              videoUrl={videoUrl}
              onClick={() => setFocused(adjustedCamera)}
            />
          );
        })}
      </div>

      {/* ========================================================
          FOCUSED CAMERA MODAL
          ======================================================== */}

      <Modal
        open={!!focused}
        onClose={() => setFocused(null)}
        title={
          focused
            ? `${focused.name} — ${focused.room}`
            : undefined
        }
      >
        {focused && (
          <div>
            <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-black flex items-center justify-center">
              {!focused.videoUrl && (
                <>
                  <div className="absolute inset-0 scanlines opacity-40 z-10 pointer-events-none" />

                  <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
                    <div className="grid grid-cols-7 gap-x-4 gap-y-3 opacity-80">
                      {Array.from({
                        length: Math.min(
                          21,
                          Math.round(focused.studentCount / 6)
                        ),
                      }).map((_, i) => (
                        <User
                          key={i}
                          size={12}
                          className="text-white/35"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {focused.videoUrl &&
              focused.status !== "offline" ? (
                <video
                  src={focused.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
                  <div className="grid grid-cols-7 gap-x-4 gap-y-3 opacity-80">
                    {Array.from({
                      length: Math.min(
                        21,
                        Math.round(focused.studentCount / 6)
                      ),
                    }).map((_, i) => (
                      <User
                        key={i}
                        size={12}
                        className="text-white/35"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* AI detection overlays */}
              {focused.detections.map((d, i) => (
                <DetectionOverlay
                  key={d.id}
                  detection={d}
                  index={i}
                />
              ))}
            </div>

            {/* Camera information */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[var(--text-2)] text-xs">
                  Students
                </div>
                <div className="font-medium">
                  {focused.studentCount}
                </div>
              </div>

              <div>
                <div className="text-[var(--text-2)] text-xs">
                  AI Confidence
                </div>
                <div className="font-medium">
                  {focused.aiConfidence}%
                </div>
              </div>

              <div>
                <div className="text-[var(--text-2)] text-xs">
                  Frame Rate
                </div>
                <div className="font-medium">
                  {focused.fps} fps
                </div>
              </div>

              <div>
                <div className="text-[var(--text-2)] text-xs">
                  Active Alerts
                </div>
                <div className="font-medium">
                  {focused.alertCount}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
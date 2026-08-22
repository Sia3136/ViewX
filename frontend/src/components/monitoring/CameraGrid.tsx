"use client";

import { useState } from "react";
import { cameras } from "@/lib/mock-data/monitoring";
import { CameraCard } from "./CameraCard";
import { Modal } from "@/components/ui/Modal";
import { Camera } from "@/lib/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { User } from "lucide-react";

const VIDEO_URLS = [
  "/videos/camera1.mp4",
  "/videos/camera2.mp4",
  "/videos/camera3.mp4",
  "/videos/camera4.mp4",
];

interface FocusedCamera {
  camera: Camera;
  videoUrl: string;
}

export function CameraGrid() {
  const [focused, setFocused] = useState<FocusedCamera | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cameras.slice(0, 4).map((cam, i) => {
          const videoUrl = VIDEO_URLS[i];

          const adjustedCamera: Camera = {
            ...cam,
            status: "live",
          };

          return (
            <CameraCard
              key={cam.id}
              camera={adjustedCamera}
              index={i}
              videoUrl={videoUrl}
              onClick={() =>
                setFocused({
                  camera: adjustedCamera,
                  videoUrl,
                })
              }
            />
          );
        })}
      </div>

      <Modal
        open={!!focused}
        onClose={() => setFocused(null)}
        title={
          focused
            ? `${focused.camera.name} — ${focused.camera.room}`
            : undefined
        }
      >
        {focused && (
          <div>
            <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-black flex items-center justify-center">
              <video
                src={focused.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 scanlines opacity-20 z-10 pointer-events-none" />

              {/* LIVE badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] breathing-dot" />
                <span className="text-[10px] font-mono font-semibold text-white tracking-wide">
                  LIVE
                </span>
              </div>

              {/* Timestamp */}
              <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                <span className="text-[10px] font-mono text-white">
                  {new Date().toLocaleTimeString("en-US", {
                    hour12: false,
                  })}
                </span>
              </div>

              {/* Detection overlays */}
              {focused.camera.detections.map((d, i) => (
                <DetectionOverlay
                  key={d.id}
                  detection={d}
                  index={i}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[var(--text-2)] text-xs">
                  Students
                </div>
                <div className="font-medium">
                  {focused.camera.studentCount}
                </div>
              </div>

              <div>
                <div className="text-[var(--text-2)] text-xs">
                  AI Confidence
                </div>
                <div className="font-medium">
                  {focused.camera.aiConfidence}%
                </div>
              </div>

              <div>
                <div className="text-[var(--text-2)] text-xs">
                  Frame Rate
                </div>
                <div className="font-medium">
                  {focused.camera.fps} fps
                </div>
              </div>

              <div>
                <div className="text-[var(--text-2)] text-xs">
                  Active Alerts
                </div>
                <div className="font-medium">
                  {focused.camera.alertCount}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
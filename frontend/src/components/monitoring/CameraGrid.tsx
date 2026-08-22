"use client";

import { useState, useEffect } from "react";
import { CameraCard } from "./CameraCard";
import { Modal } from "@/components/ui/Modal";
import { Camera } from "@/lib/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { User } from "lucide-react";

export function CameraGrid() {
  const [focused, setFocused] = useState<Camera | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/monitoring`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const mappedCameras = data.map((source: any, index: number) => ({
            id: String(source.id),
            name: source.name || `Camera ${source.id}`,
            room: `Room ${index + 1}`,
            studentCount: 35,
            aiConfidence: 100,
            fps: 30,
            status: source.status === "active" ? "live" : "offline",
            alertCount: 0,
            detections: [],
          }));
          setCameras(mappedCameras);
        }
      } catch (e) {
        console.error("Failed to fetch cameras", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCameras();
  }, []);

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

  if (loading) {
    return <div className="p-8 text-center text-[var(--text-2)]">Loading camera feeds...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cameras.length === 0 && (
          <div className="col-span-full p-8 text-center text-[var(--text-2)]">
            No video sources found.
          </div>
        )}
        {cameras.map((cam, i) => {
          const videoUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/monitoring/${cam.id}/stream`;

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
                <img
                  src={focused.videoUrl}
                  className="w-full h-full object-cover"
                  alt="Live camera feed"
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
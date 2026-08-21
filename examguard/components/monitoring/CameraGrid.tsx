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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cameras.map((cam, i) => (
          <CameraCard key={cam.id} camera={cam} index={i} onClick={() => setFocused(cam)} />
        ))}
      </div>

      <Modal open={!!focused} onClose={() => setFocused(null)} title={focused ? `${focused.name} — ${focused.room}` : undefined}>
        {focused && (
          <div>
            <div
              className="relative aspect-video rounded-xl overflow-hidden mb-4"
              style={{ background: "radial-gradient(120% 100% at 20% 0%, #12232a 0%, #0a1416 55%, #060b0c 100%)" }}
            >
              <div className="absolute inset-0 scanlines opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="grid grid-cols-7 gap-x-4 gap-y-3 opacity-80">
                  {Array.from({ length: Math.min(21, Math.round(focused.studentCount / 6)) }).map((_, i) => (
                    <User key={i} size={12} className="text-white/35" />
                  ))}
                </div>
              </div>
              {focused.detections.map((d, i) => (
                <DetectionOverlay key={d.id} detection={d} index={i} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[var(--text-2)] text-xs">Students</div>
                <div className="font-medium">{focused.studentCount}</div>
              </div>
              <div>
                <div className="text-[var(--text-2)] text-xs">AI Confidence</div>
                <div className="font-medium">{focused.aiConfidence}%</div>
              </div>
              <div>
                <div className="text-[var(--text-2)] text-xs">Frame Rate</div>
                <div className="font-medium">{focused.fps} fps</div>
              </div>
              <div>
                <div className="text-[var(--text-2)] text-xs">Active Alerts</div>
                <div className="font-medium">{focused.alertCount}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import { User, WifiOff, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Camera } from "@/lib/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { cn } from "@/lib/utils";

export function CameraCard({ camera, index, onClick }: { camera: Camera; index: number; onClick?: () => void }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);

  const hasAlert = camera.alertCount > 0;
  const offline = camera.status !== "live";

  // deterministic silhouette grid based on studentCount
  const rows = 3;
  const cols = 7;
  const seatCount = Math.min(rows * cols, Math.round(camera.studentCount / 6));

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="text-left rounded-[16px] overflow-hidden border relative group focus-visible:outline-2"
      style={{
        borderColor: hasAlert ? "color-mix(in srgb, var(--red) 45%, var(--border))" : "var(--border)",
      }}
    >
      <div
        className="relative aspect-video overflow-hidden"
        style={{
          background: "radial-gradient(120% 100% at 20% 0%, #12232a 0%, #0a1416 55%, #060b0c 100%)",
        }}
      >
        <div className="absolute inset-0 scanlines opacity-40" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {offline ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <RotateCw size={20} />
            </motion.div>
            <span className="text-xs font-mono">Reconnecting…</span>
          </div>
        ) : (
          <>
            {/* seat grid of silhouettes */}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="grid grid-cols-7 gap-x-4 gap-y-3 opacity-80">
                {Array.from({ length: seatCount }).map((_, i) => (
                  <User key={i} size={12} className="text-white/35" />
                ))}
              </div>
            </div>

            {camera.detections.map((d, i) => (
              <DetectionOverlay key={d.id} detection={d} index={i} />
            ))}
          </>
        )}

        {/* LIVE badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className={cn("w-1.5 h-1.5 rounded-full", offline ? "bg-white/40" : "bg-[var(--red)] breathing-dot")} />
          <span className="text-[10px] font-mono font-semibold text-white tracking-wide">
            {offline ? "OFFLINE" : "LIVE"}
          </span>
        </div>

        {/* timestamp */}
        <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className="text-[10px] font-mono text-white/80 tabular-nums">{time}</span>
        </div>

        {/* alert count */}
        {hasAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-[var(--red)]/90 backdrop-blur-sm px-2 py-1 rounded-md"
          >
            <span className="text-[10px] font-mono font-semibold text-white">
              {camera.alertCount} ALERT{camera.alertCount > 1 ? "S" : ""}
            </span>
          </motion.div>
        )}

        {offline && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-md">
            <WifiOff size={11} className="text-white/60" />
            <span className="text-[10px] font-mono text-white/60">Signal degraded</span>
          </div>
        )}
      </div>

      <div className="card-surface border-t-0 rounded-t-none px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {camera.name} — {camera.room}
          </span>
          <span className={cn("w-1.5 h-1.5 rounded-full", offline ? "bg-[var(--text-2)]" : "bg-[var(--sage)]")} />
        </div>
        <div className="text-xs text-[var(--text-2)] font-mono mt-0.5">
          {camera.studentCount} students · AI {camera.aiConfidence}% · {camera.fps}fps
        </div>
      </div>
    </motion.button>
  );
}

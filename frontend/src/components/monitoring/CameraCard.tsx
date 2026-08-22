"use client";

import { motion } from "framer-motion";
import {
  User,
  RotateCw,
  Plus,
  Minus,
  Maximize,
  Minimize,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Camera } from "@/lib/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { cn } from "@/lib/utils";

export function CameraCard({
  camera,
  index,
  onClick,
  videoUrl,
}: {
  camera: Camera;
  index: number;
  onClick?: () => void;
  videoUrl?: string;
}) {
  const [time, setTime] = useState("");
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
        })
      );
    };

    updateTime();

    const id = setInterval(updateTime, 1000);

    return () => clearInterval(id);
  }, []);

  // Detect browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === videoContainerRef.current
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const hasAlert = camera.alertCount > 0;
  const offline = camera.status !== "live";

  const rows = 3;
  const cols = 7;

  const seatCount = Math.min(
    rows * cols,
    Math.round(camera.studentCount / 6)
  );

  // =========================
  // ZOOM CONTROLS
  // =========================

  const zoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    setZoom((current) =>
      Math.min(2.5, Number((current + 0.25).toFixed(2)))
    );
  };

  const zoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    setZoom((current) =>
      Math.max(1, Number((current - 0.25).toFixed(2)))
    );
  };

  const resetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
  };

  // =========================
  // MOUSE WHEEL ZOOM
  // =========================

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();

    if (e.deltaY < 0) {
      setZoom((current) =>
        Math.min(2.5, Number((current + 0.1).toFixed(2)))
      );
    } else {
      setZoom((current) =>
        Math.max(1, Number((current - 0.1).toFixed(2)))
      );
    }
  };

  // =========================
  // FULLSCREEN
  // =========================

  const toggleFullscreen = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // Double click video = fullscreen
  const handleDoubleClick = async () => {
    await toggleFullscreen();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
      }}
      className="text-left rounded-[16px] overflow-hidden border relative group w-full"
      style={{
        borderColor: hasAlert
          ? "color-mix(in srgb, var(--red) 45%, var(--border))"
          : "var(--border)",
      }}
    >
      {/* ========================= */}
      {/* VIDEO CONTAINER */}
      {/* ========================= */}

      <div
        ref={videoContainerRef}
        onClick={onClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        className={cn(
          "relative aspect-video overflow-hidden bg-black flex items-center justify-center cursor-pointer",
          isFullscreen && "aspect-auto h-screen w-screen"
        )}
      >
        {/* ========================= */}
        {/* REAL VIDEO */}
        {/* ========================= */}

        {videoUrl && !offline ? (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover transition-transform duration-200"
            style={{
              transform: `scale(${zoom})`,
            }}
          />
        ) : (
          <>
            {/* Background grid */}
            <div
              className="absolute inset-0 opacity-[0.07] z-10 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Scanlines */}
            <div className="absolute inset-0 scanlines opacity-40 z-10 pointer-events-none" />

            {/* Offline display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50 z-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <RotateCw size={20} />
              </motion.div>

              <span className="text-xs font-mono">
                Offline / No Feed
              </span>
            </div>
          </>
        )}

        {/* ========================= */}
        {/* VIDEO OVERLAY */}
        {/* ========================= */}

        {videoUrl && !offline && (
          <div className="absolute inset-0 scanlines opacity-20 z-10 pointer-events-none" />
        )}

        {/* ========================= */}
        {/* LIVE BADGE */}
        {/* ========================= */}

        <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              offline
                ? "bg-white/40"
                : "bg-[var(--red)] breathing-dot"
            )}
          />

          <span className="text-[10px] font-mono font-semibold text-white tracking-wide">
            {offline ? "OFFLINE" : "LIVE"}
          </span>
        </div>

        {/* ========================= */}
        {/* TIMESTAMP */}
        {/* ========================= */}

        <div className="absolute top-2.5 right-2.5 z-30 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className="text-[10px] font-mono text-white/80 tabular-nums">
            {time}
          </span>
        </div>

        {/* ========================= */}
        {/* VIDEO CONTROLS */}
        {/* ========================= */}

        {videoUrl && !offline && (
          <div
            className="absolute bottom-2.5 right-2.5 z-40 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zoom out */}
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= 1}
              title="Zoom out"
              className="p-1.5 rounded-md text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <Minus size={14} />
            </button>

            {/* Zoom percentage */}
            <button
              type="button"
              onClick={resetZoom}
              title="Reset zoom"
              className="px-1.5 text-[10px] font-mono text-white hover:bg-white/20 rounded-md min-w-[42px]"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom in */}
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= 2.5}
              title="Zoom in"
              className="p-1.5 rounded-md text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <Plus size={14} />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={resetZoom}
              title="Reset zoom"
              className="p-1.5 rounded-md text-white hover:bg-white/20 transition"
            >
              <RotateCcw size={14} />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={
                isFullscreen
                  ? "Exit fullscreen"
                  : "Fullscreen"
              }
              className="p-1.5 rounded-md text-white hover:bg-white/20 transition"
            >
              {isFullscreen ? (
                <Minimize size={14} />
              ) : (
                <Maximize size={14} />
              )}
            </button>
          </div>
        )}

        {/* ========================= */}
        {/* ALERT COUNT */}
        {/* ========================= */}

        {hasAlert && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="absolute bottom-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-[var(--red)]/90 backdrop-blur-sm px-2 py-1 rounded-md"
          >
            <span className="text-[10px] font-mono font-semibold text-white">
              {camera.alertCount} ALERT
              {camera.alertCount > 1 ? "S" : ""}
            </span>
          </motion.div>
        )}

        {/* ========================= */}
        {/* DETECTIONS */}
        {/* ========================= */}

        {!offline &&
          camera.detections.map((d, i) => (
            <DetectionOverlay
              key={d.id}
              detection={d}
              index={i}
            />
          ))}

        {/* ========================= */}
        {/* ZOOM INDICATOR */}
        {/* ========================= */}

        {zoom > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-mono text-white">
              ZOOM {Math.round(zoom * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* ========================= */}
      {/* CAMERA INFORMATION */}
      {/* ========================= */}

      <div className="card-surface border-t-0 rounded-t-none px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {camera.name} — {camera.room}
          </span>

          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              offline
                ? "bg-[var(--text-2)]"
                : "bg-[var(--sage)]"
            )}
          />
        </div>

        <div className="text-xs text-[var(--text-2)] font-mono mt-0.5">
          {camera.studentCount} students · AI{" "}
          {camera.aiConfidence}% · {camera.fps}fps
        </div>
      </div>
    </motion.div>
  );
}
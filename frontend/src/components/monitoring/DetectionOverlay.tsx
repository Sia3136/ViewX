"use client";

import { motion } from "framer-motion";
import { Detection } from "@/lib/types";
import { cn } from "@/lib/utils";

function getDetectionStyles(type?: string) {
  const value = (type || "").toLowerCase();

  if (
    value.includes("critical") ||
    value.includes("phone") ||
    value.includes("mobile") ||
    value.includes("cheating")
  ) {
    return {
      border: "border-red-400",
      bg: "bg-red-500/15",
      label: "bg-red-500/90",
      text: "text-white",
      glow: "shadow-[0_0_18px_rgba(239,68,68,0.45)]",
    };
  }

  if (
    value.includes("high") ||
    value.includes("multiple") ||
    value.includes("person")
  ) {
    return {
      border: "border-orange-400",
      bg: "bg-orange-500/12",
      label: "bg-orange-500/90",
      text: "text-white",
      glow: "shadow-[0_0_18px_rgba(249,115,22,0.4)]",
    };
  }

  if (
    value.includes("medium") ||
    value.includes("looking") ||
    value.includes("attention")
  ) {
    return {
      border: "border-amber-400",
      bg: "bg-amber-500/12",
      label: "bg-amber-500/90",
      text: "text-white",
      glow: "shadow-[0_0_18px_rgba(245,158,11,0.35)]",
    };
  }

  return {
    border: "border-sky-400",
    bg: "bg-sky-500/10",
    label: "bg-sky-500/90",
    text: "text-white",
    glow: "shadow-[0_0_18px_rgba(14,165,233,0.3)]",
  };
}

export function DetectionOverlay({
  detection,
  index = 0,
}: {
  detection: Detection;
  index?: number;
}) {
  const styles = getDetectionStyles(
    detection.label
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.25,
        delay: index * 0.04,
      }}
      className={cn(
        "absolute pointer-events-none",
        "border-2 rounded-md",
        styles.border,
        styles.bg,
        styles.glow
      )}
      style={{
        left: `${detection.x}%`,
        top: `${detection.y}%`,
        width: `${detection.w}%`,
        height: `${detection.h}%`,
      }}
    >
      {/* corner accents */}
      <span
        className={cn(
          "absolute -top-[2px] -left-[2px] w-3 h-3 border-l-2 border-t-2",
          styles.border
        )}
      />

      <span
        className={cn(
          "absolute -top-[2px] -right-[2px] w-3 h-3 border-r-2 border-t-2",
          styles.border
        )}
      />

      <span
        className={cn(
          "absolute -bottom-[2px] -left-[2px] w-3 h-3 border-l-2 border-b-2",
          styles.border
        )}
      />

      <span
        className={cn(
          "absolute -bottom-[2px] -right-[2px] w-3 h-3 border-r-2 border-b-2",
          styles.border
        )}
      />

      {/* Detection label */}
      <div
        className={cn(
          "absolute -top-6 left-0 px-2 py-1 rounded-md",
          "text-[9px] font-mono font-semibold uppercase tracking-wide",
          "backdrop-blur-md whitespace-nowrap",
          styles.label,
          styles.text
        )}
      >
        {detection.label || "Detection"}

        {detection.confidence !== undefined && (
          <span className="ml-1 opacity-80">
            {Math.round(detection.confidence)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
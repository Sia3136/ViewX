"use client";

import { motion } from "framer-motion";
import { Detection } from "@/lib/types";

const severityColor: Record<Detection["severity"], string> = {
  normal: "var(--sage-light)",
  warning: "var(--amber)",
  critical: "var(--red)",
};

export function DetectionOverlay({ detection, index }: { detection: Detection; index: number }) {
  const color = severityColor[detection.severity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="absolute"
      style={{
        left: `${detection.x}%`,
        top: `${detection.y}%`,
        width: `${detection.w}%`,
        height: `${detection.h}%`,
      }}
    >
      <motion.div
        className="w-full h-full rounded-[3px]"
        style={{ border: `1.5px solid ${color}` }}
        animate={{ boxShadow: [`0 0 0px ${color}`, `0 0 10px ${color}`, `0 0 0px ${color}`] }}
        transition={{ duration: 1.6, delay: 0.5 + index * 0.12, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.25 + index * 0.12 }}
        className="absolute -top-5 left-0 flex items-center gap-1 whitespace-nowrap"
      >
        <span
          className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-sm tracking-wide"
          style={{ background: color, color: "#0a0f0c" }}
        >
          {detection.label} · {detection.confidence}%
        </span>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils";
import { examBanner } from "@/lib/mock-data/dashboard";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl sm:text-3xl font-semibold tabular-nums text-white">{value}</span>
      <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-white/70 uppercase">{label}</span>
    </div>
  );
}

export function ExamStatusBanner() {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(formatTime(new Date()));
    const id = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[20px] p-6 sm:p-7"
      style={{
        background: "linear-gradient(120deg, var(--sage) 0%, #4A6653 55%, #3D5747 100%)",
      }}
    >
      {/* organic drifting shapes */}
      <motion.div
        className="absolute -right-16 -top-16 w-64 h-64 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)" }}
        animate={{ x: [0, 12, 0], y: [0, -8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -left-10 bottom-0 w-56 h-56 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)" }}
        animate={{ x: [0, -10, 0], y: [0, 10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="scanlines absolute inset-0 opacity-30" />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-white breathing-dot" />
            <span className="text-[11px] font-mono tracking-[0.15em] text-white/80">{examBanner.status}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">{examBanner.subject}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-8">
          <Stat value={String(examBanner.students)} label="Students" />
          <Stat value={String(examBanner.activeRooms)} label="Active Rooms" />
          <Stat value={`${examBanner.monitorHealth}%`} label="Monitor Health" />
          <Stat value={String(examBanner.activeAlerts).padStart(2, "0")} label="Active Alerts" />
        </div>

        <div className="hidden lg:block text-white/70 font-mono text-sm tabular-nums pl-4">{time}</div>
      </div>
    </motion.div>
  );
}

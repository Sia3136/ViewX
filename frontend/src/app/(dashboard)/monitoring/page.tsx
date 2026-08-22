"use client";

import { motion } from "framer-motion";
import { CameraGrid } from "@/components/monitoring/CameraGrid";
import { monitoringHeaderStats } from "@/lib/mock-data/monitoring";

export default function MonitoringPage() {
  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Live Monitoring</h1>
        <p className="text-[var(--text-2)] mt-2 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[var(--sage)] font-mono text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--sage)] breathing-dot" />
            EXAM LIVE
          </span>
          · {monitoringHeaderStats.examSubject} · {monitoringHeaderStats.roomsActive} rooms active
        </p>
      </motion.div>

      <CameraGrid />
    </div>
  );
}

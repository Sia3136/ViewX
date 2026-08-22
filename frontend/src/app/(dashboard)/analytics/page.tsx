"use client";

import { motion } from "framer-motion";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";

export default function AnalyticsPage() {
  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-[var(--text-2)] mt-2">Patterns across alerts, rooms, and AI performance.</p>
      </motion.div>
      <AnalyticsCharts />
    </div>
  );
}

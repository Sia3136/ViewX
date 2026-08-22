"use client";

import { motion } from "framer-motion";
import { StudentTable } from "@/components/students/StudentTable";

export default function StudentsPage() {
  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Student Directory</h1>
          <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono mt-1">SIMULATED DATA</span>
        </div>
        <p className="text-[var(--text-2)] mt-2">Comprehensive risk profiles and monitoring history.</p>
      </motion.div>
      <StudentTable />
    </div>
  );
}

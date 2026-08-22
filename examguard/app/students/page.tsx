"use client";

import { motion } from "framer-motion";
import { StudentTable } from "@/components/students/StudentTable";

export default function StudentsPage() {
  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Students</h1>
        <p className="text-[var(--text-2)] mt-2">Monitoring status and risk profile for every student in the examination.</p>
      </motion.div>
      <StudentTable />
    </div>
  );
}

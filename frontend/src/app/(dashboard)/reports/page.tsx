"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, FileWarning, UserCheck, Cpu, Download, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

const REPORTS = [
  {
    id: "session-summary",
    icon: FileText,
    title: "Session Summary",
    description: "A complete overview of the examination session, including monitoring stats and outcomes.",
  },
  {
    id: "incident-report",
    icon: FileWarning,
    title: "Incident Report",
    description: "Every alert generated during the session with evidence, timestamps, and resolution status.",
  },
  {
    id: "student-monitoring",
    icon: UserCheck,
    title: "Student Monitoring Report",
    description: "Per-student monitoring history, risk timeline, and AI observations.",
  },
  {
    id: "ai-performance",
    icon: Cpu,
    title: "AI Performance Report",
    description: "Detection accuracy, confidence trends, and system health across the session.",
  },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [ready, setReady] = useState<Set<string>>(new Set());

  function generate(id: string) {
    setGenerating(id);
    window.setTimeout(() => {
      setGenerating(null);
      setReady((prev) => new Set(prev).add(id));
    }, 1600);
  }

  return (
    <div className="max-w-[1100px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Reports</h1>
        <p className="text-[var(--text-2)] mt-2">Generate and export documentation for this examination.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {REPORTS.map((report, i) => {
          const Icon = report.icon;
          const isGenerating = generating === report.id;
          const isReady = ready.has(report.id);
          return (
            <GlassCard
              key={report.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-4">
                <Icon size={18} className="text-[var(--sage)]" />
              </div>
              <h3 className="font-medium mb-1.5">{report.title}</h3>
              <p className="text-sm text-[var(--text-2)] leading-relaxed mb-5">{report.description}</p>

              {isReady ? (
                <div className="flex gap-2">
                  <GlassButton size="sm" variant="secondary" className="flex-1">
                    <Download size={13} /> Export PDF
                  </GlassButton>
                  <GlassButton size="sm" variant="ghost" className="flex-1">
                    <Download size={13} /> Export CSV
                  </GlassButton>
                </div>
              ) : (
                <GlassButton size="sm" variant="primary" onClick={() => generate(report.id)} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Generating…
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </GlassButton>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { Drawer } from "@/components/ui/Drawer";
import { Student } from "@/lib/types";
import { motion } from "framer-motion";

const riskColor: Record<string, string> = {
  low: "var(--sage)",
  medium: "var(--amber)",
  high: "var(--red)",
};

export function StudentDrawer({ student, onClose }: { student: Student | null; onClose: () => void }) {
  return (
    <Drawer open={!!student} onClose={onClose} title={`ST - ${student?.id}`} subtitle={student ? `${student.id} · ${student.room}` : undefined}>
      {student && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--sage)] text-white flex items-center justify-center text-lg font-semibold">
              {student.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <div className="font-medium">ST - {student.id}</div>
              <div className="text-xs text-[var(--text-2)] font-mono mt-0.5">
                Monitoring: <span className="capitalize">{student.monitoring}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-[var(--text-2)] mb-1">Risk Level</div>
              <div className="font-medium capitalize" style={{ color: riskColor[student.risk] }}>
                {student.risk}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-2)] mb-1">Alerts</div>
              <div className="font-medium">{student.alerts}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-2)] mb-1">Room</div>
              <div className="font-medium">{student.room}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-2)] mb-1">Last Activity</div>
              <div className="font-medium font-mono">{student.lastActivity}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--text-2)] mb-2">Risk Timeline</div>
            <div className="flex items-end gap-1.5 h-16">
              {[22, 30, 18, student.risk === "high" ? 78 : student.risk === "medium" ? 45 : 20, 25, 15, 12].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${v}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="flex-1 rounded-t-sm"
                  style={{ background: v > 60 ? "var(--red)" : v > 35 ? "var(--amber)" : "var(--sage-light)" }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--text-2)] mb-2">AI Observations</div>
            <div className="text-sm card-surface p-3 rounded-xl leading-relaxed">
              {student.risk === "high"
                ? "Elevated gaze-shift frequency observed over the last 20 minutes. Recommend a visual check by the room invigilator."
                : student.risk === "medium"
                ? "One minor anomaly flagged and resolved automatically. No further action needed at this time."
                : "No unusual patterns detected. Monitoring nominal throughout the session."}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

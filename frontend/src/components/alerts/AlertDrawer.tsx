"use client";

import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { Alert } from "@/lib/types";
import { motion } from "framer-motion";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-2)] mb-1">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function AlertDrawer({
  alert,
  onClose,
  onAction,
}: {
  alert: Alert | null;
  onClose: () => void;
  onAction: (alert: Alert, action: "confirm" | "dismiss" | "escalate") => void;
}) {
  return (
    <Drawer open={!!alert} onClose={onClose} title={alert?.type} subtitle={alert ? `${alert.room} · Student ${alert.studentId}` : undefined}>
      {alert && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <StatusBadge severity={alert.severity} />
            <span className="text-xs font-mono text-[var(--text-2)]">{alert.timestamp}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Student" value={alert.studentName || alert.studentId} />
            <Field label="Room" value={alert.room} />
            <Field label="Confidence" value={`${alert.confidence}%`} />
            <Field label="Status" value={alert.status} />
          </div>

          {alert.evidence && (
            <div>
              <div className="text-xs text-[var(--text-2)] mb-1.5">Evidence</div>
              <div className="text-sm card-surface p-3 rounded-xl leading-relaxed">{alert.evidence}</div>
            </div>
          )}

          {alert.aiAnalysis && (
            <div>
              <div className="text-xs text-[var(--text-2)] mb-1.5">AI Analysis</div>
              <div className="text-sm card-surface p-3 rounded-xl leading-relaxed">{alert.aiAnalysis}</div>
            </div>
          )}

          {alert.timeline && (
            <div>
              <div className="text-xs text-[var(--text-2)] mb-3">Timeline</div>
              <div className="flex flex-col gap-3">
                {alert.timeline.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="flex gap-3 text-sm"
                  >
                    <span className="font-mono text-xs text-[var(--text-2)] w-16 shrink-0 pt-0.5">{t.time}</span>
                    <span className="relative pl-4 border-l border-[var(--border)]">
                      <span className="absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-[var(--sage)]" />
                      {t.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 sticky bottom-0">
            <GlassButton variant="primary" className="flex-1" onClick={() => onAction(alert, "confirm")}>
              Confirm
            </GlassButton>
            <GlassButton variant="secondary" className="flex-1" onClick={() => onAction(alert, "dismiss")}>
              Dismiss
            </GlassButton>
            <GlassButton variant="danger" className="flex-1" onClick={() => onAction(alert, "escalate")}>
              Escalate
            </GlassButton>
          </div>
        </div>
      )}
    </Drawer>
  );
}

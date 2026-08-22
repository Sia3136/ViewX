"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert } from "@/lib/types";

export function AlertCard({
  alert,
  index,
  onReview,
  onDismiss,
  onEscalate,
}: {
  alert: Alert;
  index: number;
  onReview: (a: Alert) => void;
  onDismiss: (a: Alert) => void;
  onEscalate: (a: Alert) => void;
}) {
  return (
    <GlassCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="!p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-medium text-[15px]">{alert.type}</h3>
          <p className="text-xs text-[var(--text-2)] mt-1 font-mono">
            {alert.room} · Student {alert.studentId} · {alert.confidence}% confidence
          </p>
        </div>
        <StatusBadge severity={alert.severity} />
      </div>

      <p className="text-sm text-[var(--text-2)] mb-4 leading-relaxed">{alert.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[var(--text-2)]">{alert.timestamp}</span>
        <div className="flex gap-2">
          <GlassButton size="sm" variant="ghost" onClick={() => onDismiss(alert)}>
            Dismiss
          </GlassButton>
          <GlassButton size="sm" variant="secondary" onClick={() => onReview(alert)}>
            Review
          </GlassButton>
          <GlassButton size="sm" variant="danger" onClick={() => onEscalate(alert)}>
            Escalate
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}

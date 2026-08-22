"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, Clock, MapPin } from "lucide-react";
import { Alert } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

function getSeverityStyles(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return {
        border:
          "border-red-500/40 dark:border-red-400/30",
        background:
          "bg-gradient-to-r from-red-500/[0.13] via-red-500/[0.06] to-transparent",
        glow:
          "shadow-[inset_3px_0_0_rgba(239,68,68,0.8),0_8px_30px_-18px_rgba(239,68,68,0.45)]",
        icon:
          "bg-red-500/15 text-red-600 dark:text-red-400",
        dot:
          "bg-red-500",
        accent:
          "text-red-600 dark:text-red-400",
      };

    case "high":
      return {
        border:
          "border-orange-500/40 dark:border-orange-400/30",
        background:
          "bg-gradient-to-r from-orange-500/[0.13] via-orange-500/[0.055] to-transparent",
        glow:
          "shadow-[inset_3px_0_0_rgba(249,115,22,0.8),0_8px_30px_-18px_rgba(249,115,22,0.4)]",
        icon:
          "bg-orange-500/15 text-orange-600 dark:text-orange-400",
        dot:
          "bg-orange-500",
        accent:
          "text-orange-600 dark:text-orange-400",
      };

    case "medium":
      return {
        border:
          "border-amber-500/40 dark:border-amber-400/30",
        background:
          "bg-gradient-to-r from-amber-500/[0.13] via-amber-500/[0.055] to-transparent",
        glow:
          "shadow-[inset_3px_0_0_rgba(245,158,11,0.8),0_8px_30px_-18px_rgba(245,158,11,0.35)]",
        icon:
          "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        dot:
          "bg-amber-500",
        accent:
          "text-amber-600 dark:text-amber-400",
      };

    default:
      return {
        border:
          "border-sky-500/35 dark:border-sky-400/25",
        background:
          "bg-gradient-to-r from-sky-500/[0.11] via-sky-500/[0.045] to-transparent",
        glow:
          "shadow-[inset_3px_0_0_rgba(14,165,233,0.7),0_8px_30px_-18px_rgba(14,165,233,0.3)]",
        icon:
          "bg-sky-500/15 text-sky-600 dark:text-sky-400",
        dot:
          "bg-sky-500",
        accent:
          "text-sky-600 dark:text-sky-400",
      };
  }
}

export function AlertCard({
  alert,
  onClick,
}: {
  alert: Alert;
  onClick?: () => void;
}) {
  const styles = getSeverityStyles(alert.severity);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group relative w-full text-left overflow-hidden rounded-2xl",
        "border backdrop-blur-xl transition-all duration-300",
        styles.border,
        styles.background,
        styles.glow
      )}
    >
      {/* subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/30 via-white/10 to-transparent dark:from-white/10" />

      <div className="p-4">
        <div className="flex items-start gap-3">

          {/* Alert icon */}
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              styles.icon
            )}
          >
            <AlertTriangle size={17} />
          </div>

          <div className="min-w-0 flex-1">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      styles.dot,
                      alert.severity === "critical" && "animate-pulse"
                    )}
                  />

                  <h3 className="font-semibold text-sm truncate">
                    {alert.type}
                  </h3>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-2)]">
                  <MapPin size={12} />
                  <span>{alert.room}</span>
                  <span className="opacity-40">•</span>
                  <span>Student {alert.studentId}</span>
                </div>
              </div>

              <ChevronRight
                size={17}
                className={cn(
                  "shrink-0 text-[var(--text-2)] transition-all duration-200",
                  "group-hover:translate-x-1",
                  styles.accent
                )}
              />
            </div>

            {/* Details */}
            <div className="mt-3 flex items-center justify-between gap-3">

              <div className="flex items-center gap-2">
                <StatusBadge severity={alert.severity} />

                <span className="text-[11px] text-[var(--text-2)]">
                  {alert.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-2)] font-mono">
                <Clock size={11} />
                {alert.timestamp}
              </div>
            </div>

            {/* Evidence */}
            {alert.evidence && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/[0.035] dark:bg-white/[0.035] px-3 py-2.5">
                <p className="text-xs leading-relaxed text-[var(--text-2)] line-clamp-2">
                  {alert.evidence}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom severity accent */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[2px] opacity-60",
          styles.dot
        )}
      />
    </motion.button>
  );
}
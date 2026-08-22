"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";

import { Alert } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

function getSeverityStyles(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return {
        border: "border-red-500/30 dark:border-red-400/25",
        background:
          "bg-[var(--surface)]",
        glow:
          "shadow-[inset_4px_0_0_rgba(239,68,68,0.9),0_10px_30px_-20px_rgba(239,68,68,0.5)]",
        icon: "bg-red-500/10 text-red-600 dark:text-red-400",
        dot: "bg-red-500",
        accent: "text-red-600 dark:text-red-400",
        label: "Critical",
      };

    case "high":
      return {
        border: "border-orange-500/30 dark:border-orange-400/25",
        background: "bg-[var(--surface)]",
        glow:
          "shadow-[inset_4px_0_0_rgba(249,115,22,0.9),0_10px_30px_-20px_rgba(249,115,22,0.4)]",
        icon: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        dot: "bg-orange-500",
        accent: "text-orange-600 dark:text-orange-400",
        label: "High",
      };

    case "medium":
      return {
        border: "border-amber-500/30 dark:border-amber-400/25",
        background: "bg-[var(--surface)]",
        glow:
          "shadow-[inset_4px_0_0_rgba(245,158,11,0.9),0_10px_30px_-20px_rgba(245,158,11,0.35)]",
        icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        dot: "bg-amber-500",
        accent: "text-amber-600 dark:text-amber-400",
        label: "Medium",
      };

    default:
      return {
        border: "border-sky-500/25 dark:border-sky-400/20",
        background: "bg-[var(--surface)]",
        glow:
          "shadow-[inset_4px_0_0_rgba(14,165,233,0.8),0_10px_30px_-20px_rgba(14,165,233,0.3)]",
        icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        dot: "bg-sky-500",
        accent: "text-sky-600 dark:text-sky-400",
        label: "Low",
      };
  }
}

/*
 * Generates a readable investigation summary when the backend
 * does not provide a description.
 */
function getAlertExplanation(alert: Alert) {
  if (alert.description) {
    return alert.description;
  }

  const type = alert.type?.toLowerCase() || "";

  if (type.includes("phone") || type.includes("mobile")) {
    return "The monitoring system detected a possible mobile device within the student's field of view. The event was flagged for invigilator review.";
  }

  if (type.includes("multiple") || type.includes("person")) {
    return "The camera detected more than one person in the monitored area. The event has been flagged to verify whether another individual is present.";
  }

  if (type.includes("looking") || type.includes("gaze")) {
    return "The student's head and gaze direction remained away from the examination area for an unusual duration. Manual verification is recommended.";
  }

  if (type.includes("movement")) {
    return "Unusual movement was detected within the examination area. The system has marked this moment for further review by the monitoring team.";
  }

  if (type.includes("cheat") || type.includes("suspicious")) {
    return "The AI detected behaviour that differs from the expected examination pattern. The captured evidence should be reviewed before taking any action.";
  }

  return "The AI monitoring system identified an unusual event during the examination session. Review the captured evidence to determine whether further action is required.";
}

export function AlertCard({
  alert,
  onClick,
}: {
  alert: Alert;
  onClick?: () => void;
}) {
  const styles = getSeverityStyles(alert.severity);
  const explanation = getAlertExplanation(alert);

  /*
   * Supports common backend property names without forcing
   * you to immediately change your Alert type.
   *
   * Later we can standardize this to alert.evidenceImage.
   */
  const evidenceImage =
    (alert as any).evidenceImage ||
    (alert as any).evidence_image ||
    (alert as any).snapshot ||
    (alert as any).imageUrl ||
    (alert as any).image_url ||
    (alert as any).frameUrl ||
    (alert as any).frame_url;

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
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Alert icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              styles.icon
            )}
          >
            <AlertTriangle size={18} />
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
                      alert.severity.toLowerCase() === "critical" &&
                        "animate-pulse"
                    )}
                  />

                  <h3 className="font-semibold text-[15px] truncate">
                    {alert.type}
                  </h3>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-2)]">
                  <MapPin size={12} />

                  <span>{alert.room}</span>

                  <span className="opacity-40">•</span>

                  <span>Student {alert.studentId}</span>
                </div>
              </div>

              <ChevronRight
                size={17}
                className={cn(
                  "shrink-0 transition-all duration-200",
                  "text-[var(--text-2)] group-hover:translate-x-1",
                  styles.accent
                )}
              />
            </div>

            {/* Investigation explanation */}
            <div className="mt-4">
              <p className="text-sm leading-6 text-[var(--text-2)]">
                {explanation}
              </p>
            </div>

            {/* Evidence image */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-2)]">
                  Evidence
                </span>

                <span className="text-[10px] font-mono text-[var(--text-2)]">
                  {alert.timestamp}
                </span>
              </div>

              {evidenceImage ? (
                <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-black/5 dark:bg-white/5">
                  <img
                    src={evidenceImage}
                    alt={`Evidence captured at ${alert.timestamp}`}
                    className="w-full h-44 object-cover"
                  />

                  {/* Camera overlay */}
                  <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex items-center justify-between text-[10px] text-white">
                      <span className="font-mono">
                        CAMERA · {alert.room}
                      </span>

                      <span className="font-mono">
                        {alert.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Severity marker */}
                  <div
                    className={cn(
                      "absolute top-2 right-2 px-2 py-1 rounded-md",
                      "bg-black/60 backdrop-blur-md text-[10px] text-white font-medium"
                    )}
                  >
                    {styles.label}
                  </div>
                </div>
              ) : (
                <div className="h-36 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 flex flex-col items-center justify-center text-[var(--text-2)]">
                  <ImageIcon size={22} className="mb-2 opacity-60" />

                  <span className="text-xs">
                    Evidence frame unavailable
                  </span>

                  <span className="text-[10px] mt-1 opacity-70">
                    Camera snapshot not attached to this event
                  </span>
                </div>
              )}
            </div>

            {/* Bottom metadata */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge severity={alert.severity} />

                <span className="text-[11px] capitalize text-[var(--text-2)]">
                  {alert.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-2)] font-mono">
                <Clock size={11} />
                {alert.timestamp}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom severity indicator */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[2px] opacity-70",
          styles.dot
        )}
      />
    </motion.button>
  );
}
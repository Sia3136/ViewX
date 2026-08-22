"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Camera,
  ShieldCheck,
  Users,
} from "lucide-react";

import { CameraGrid } from "@/components/monitoring/CameraGrid";
import { useDemoMode } from "@/lib/demo-context";
import { systemHealth } from "@/lib/mock-data/dashboard";

export default function OverviewPage() {
  const { liveAlertCount } = useDemoMode();

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* PAGE HEADER */}
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--text)] breathing-dot" />

            <span className="text-xs font-mono uppercase tracking-[0.15em] text-[var(--text-2)]">
              Examination Live
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Live Surveillance
          </h1>

          <p className="text-sm text-[var(--text-2)] mt-1">
            Real-time examination hall monitoring
          </p>
        </div>

        {/* STATUS METRICS */}
        <div className="flex items-center gap-2">
          <StatusItem
            icon={Camera}
            value="4"
            label="Cameras"
          />

          <StatusItem
            icon={Users}
            value="28"
            label="Students"
          />

          <StatusItem
            icon={AlertTriangle}
            value={String(liveAlertCount)}
            label="Alerts"
          />

          <StatusItem
            icon={Activity}
            value={`${systemHealth.systemHealth}%`}
            label="Health"
          />
        </div>
      </motion.div>

      {/* MAIN COMMAND CENTER */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
        {/* CAMERAS */}
        <section
          className="
            bg-[var(--surface)]
            border
            rounded-2xl
            p-4
            min-w-0
          "
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">
                Surveillance Feeds
              </h2>

              <p className="text-xs text-[var(--text-2)] mt-0.5">
                Connected examination cameras
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text)] breathing-dot" />
              All systems operational
            </div>
          </div>

          <CameraGrid />
        </section>

        {/* ALERT STACK */}
        <section
          className="
            bg-[var(--surface)]
            border
            rounded-2xl
            min-h-[500px]
            max-h-[calc(100vh-150px)]
            overflow-hidden
            flex
            flex-col
          "
        >
          <div className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Alert Feed
                </h2>

                <p className="text-xs text-[var(--text-2)] mt-0.5">
                  Recent monitoring events
                </p>
              </div>

              {liveAlertCount > 0 && (
                <span
                  className="
                    min-w-6
                    h-6
                    px-2
                    rounded-full
                    bg-[var(--text)]
                    text-[var(--bg)]
                    text-[10px]
                    font-mono
                    flex
                    items-center
                    justify-center
                  "
                >
                  {liveAlertCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <AlertStack />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   STATUS ITEM
   ============================================================ */

function StatusItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div
      className="
        hidden
        sm:flex
        items-center
        gap-2
        px-3
        py-2
        rounded-lg
        bg-[var(--surface)]
        border
      "
    >
      <Icon
        size={14}
        className="text-[var(--text-2)]"
      />

      <div className="flex items-baseline gap-1">
        <span className="text-sm font-semibold">
          {value}
        </span>

        <span className="text-[10px] text-[var(--text-3)]">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   ALERT STACK
   ============================================================ */

function AlertStack() {
  const alerts = [
    {
      severity: "CRITICAL",
      type: "Suspicious Activity",
      location: "CAM-02 · Seat F01",
      description:
        "Detected unusual hand movement pattern.",
      time: "1m ago",
    },
    {
      severity: "HIGH",
      type: "Head Turn",
      location: "CAM-01 · Seat D07",
      description:
        "Student orientation deviated from forward position.",
      time: "2m ago",
    },
    {
      severity: "MEDIUM",
      type: "Body Rotation",
      location: "CAM-03 · Seat B04",
      description:
        "Torso orientation sustained for 3.2 seconds.",
      time: "4m ago",
    },
    {
      severity: "LOW",
      type: "Movement Detected",
      location: "CAM-04 · Seat C12",
      description:
        "Minor movement detected in monitored area.",
      time: "6m ago",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert, index) => (
        <motion.div
          key={`${alert.location}-${index}`}
          initial={{
            opacity: 0,
            x: 12,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            delay: index * 0.06,
          }}
          className="
            rounded-xl
            border
            bg-[var(--surface-2)]
            p-3
            hover:bg-[var(--surface-3)]
            transition-colors
            cursor-pointer
          "
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="
                    text-[9px]
                    font-mono
                    font-semibold
                    px-1.5
                    py-0.5
                    rounded
                    bg-[var(--text)]
                    text-[var(--bg)]
                  "
                >
                  {alert.severity}
                </span>

                <span className="text-[10px] font-mono text-[var(--text-3)]">
                  {alert.location}
                </span>
              </div>

              <div className="text-sm font-medium">
                {alert.type}
              </div>

              <p className="text-xs text-[var(--text-2)] mt-1 leading-relaxed">
                {alert.description}
              </p>
            </div>

            <span className="text-[10px] text-[var(--text-3)] whitespace-nowrap">
              {alert.time}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Eye, Settings2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useDemoMode } from "@/lib/demo-context";
import { ActivityEvent } from "@/lib/types";

const iconMap: Record<ActivityEvent["kind"], { icon: typeof Eye; color: string }> = {
  detection: { icon: Eye, color: "text-[var(--blue)]" },
  alert: { icon: AlertTriangle, color: "text-[var(--amber)]" },
  system: { icon: Settings2, color: "text-[var(--text-2)]" },
  resolved: { icon: CheckCircle2, color: "text-[var(--sage)]" },
};

export function ActivityFeed() {
  const { activity } = useDemoMode();

  return (
    <GlassCard hover={false} className="!p-0 overflow-hidden">
      <div className="p-5 pb-3 border-b">
        <h3 className="font-medium">Activity Timeline</h3>
        <p className="text-xs text-[var(--text-2)] mt-0.5">Live feed of AI-detected events</p>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {activity.map((event) => {
            const { icon: Icon, color } = iconMap[event.kind];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-3 px-5 py-3 border-b last:border-b-0 hover:bg-[var(--surface-2)]/50 transition-colors"
              >
                <Icon size={15} className={color} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{event.label}</div>
                  <div className="text-xs text-[var(--text-2)]">{event.room}</div>
                </div>
                <span className="text-xs font-mono text-[var(--text-2)] tabular-nums shrink-0">{event.time}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}

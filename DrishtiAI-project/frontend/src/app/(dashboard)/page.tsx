"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Eye, Activity, BarChart2 } from "lucide-react";
import { ExamStatusBanner } from "@/components/dashboard/ExamStatusBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { GlassCard } from "@/components/ui/GlassCard";
import { systemHealth } from "@/lib/mock-data/dashboard";
import { useDemoMode } from "@/lib/demo-context";
import { roomRisk } from "@/lib/mock-data/analytics";
import { analyticsService, AnalyticsSummary } from "@/lib/services/analytics";

export default function OverviewPage() {
  const { liveAlertCount } = useDemoMode();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    analyticsService.getSummary().then(setAnalytics).catch(console.error);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Good morning, <span className="font-serif-italic">Admin</span>
        </h1>
        <p className="text-[var(--text-2)] mt-2">Your examination environment is being monitored by ExamGuard AI.</p>
      </motion.div>

      <ExamStatusBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          icon={BarChart2}
          iconColor="text-[var(--text-2)]"
          value={analytics?.totalEvents || 0}
          label="Total System Events"
          sublabel="Historical events recorded"
          index={0}
        />
        <MetricCard
          icon={AlertTriangle}
          iconColor="text-[var(--amber)]"
          value={liveAlertCount}
          label="Active Live Alerts"
          sublabel="Real-time WebSocket feed"
          index={1}
        />
        <MetricCard
          icon={Eye}
          iconColor="text-[var(--blue)]"
          value={systemHealth.monitoringAccuracy}
          suffix="%"
          label="Monitoring Accuracy"
          sublabel="(Simulated Metric)"
          delta={systemHealth.monitoringAccuracyDelta}
          index={2}
        />
        <MetricCard
          icon={Activity}
          iconColor="text-[var(--sage)]"
          value={systemHealth.systemHealth}
          suffix="%"
          label="System Health"
          sublabel="(Simulated Metric)"
          delta={0.1}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ActivityFeed />
        </div>
        <GlassCard hover={false} className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="p-5 pb-3 border-b">
            <h3 className="font-medium">Room Risk</h3>
            <p className="text-xs text-[var(--text-2)] mt-0.5">Composite risk score by room (Simulated)</p>
          </div>
          <div className="p-5 flex flex-col gap-3.5">
            {roomRisk.map((r, i) => (
              <motion.div
                key={r.room}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.35 }}
              >
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{r.room}</span>
                  <span className="text-[var(--text-2)] font-mono text-xs">{r.risk}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: r.risk > 60 ? "var(--red)" : r.risk > 35 ? "var(--amber)" : "var(--sage)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.risk}%` }}
                    transition={{ duration: 0.8, delay: 0.1 + 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

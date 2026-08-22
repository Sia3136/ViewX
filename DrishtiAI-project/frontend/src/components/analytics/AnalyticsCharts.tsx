"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { analyticsService, AnalyticsSummary } from "@/lib/services/analytics";
import { roomRisk, aiConfidenceTrend, systemHealthTrend } from "@/lib/mock-data/analytics";
import { ChartCard } from "./ChartCard";

const PIE_COLORS = ["var(--sage)", "var(--sage-light)", "var(--blue)", "var(--amber)", "var(--red)"];

function tooltipStyle() {
  return {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  };
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getSummary().then((res) => {
      setData(res);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return <div className="text-center py-10 text-[var(--text-2)]">Loading analytics...</div>;
  }

  const alertCategories = Object.entries(data.byType).map(([key, val]) => ({ name: key, value: val }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <ChartCard title="Alerts Over Time" subtitle="Alert volume across the exam session (Simulated Trend)" index={0}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.trendData} margin={{ left: -20, right: 8 }}>
            <defs>
              <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sage)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--sage)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle()} />
            <Area type="monotone" dataKey="alerts" stroke="var(--sage)" strokeWidth={2} fill="url(#alertGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Alert Categories" subtitle="Breakdown by detection type" index={1}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={alertCategories}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {alertCategories.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle()} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {alertCategories.map((c, i) => (
            <span key={c.name} className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
              <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              {c.name}
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Room Risk" subtitle="Composite risk score by room (Simulated)" index={2}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={roomRisk} margin={{ left: -20, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="room" tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle()} />
            <Bar dataKey="risk" radius={[6, 6, 0, 0]}>
              {roomRisk.map((r, i) => (
                <Cell key={i} fill={r.risk > 60 ? "var(--red)" : r.risk > 35 ? "var(--amber)" : "var(--sage)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="AI Confidence & System Health" subtitle="Trend across the session (Simulated)" index={3}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart margin={{ left: -20, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="time" allowDuplicatedCategory={false} tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle()} />
            <Line data={aiConfidenceTrend} type="monotone" dataKey="confidence" stroke="var(--blue)" strokeWidth={2} dot={false} name="AI Confidence" />
            <Line data={systemHealthTrend} type="monotone" dataKey="health" stroke="var(--sage)" strokeWidth={2} dot={false} name="System Health" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 justify-center text-xs text-[var(--text-2)]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--blue)]" /> AI Confidence</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--sage)]" /> System Health</span>
        </div>
      </ChartCard>
    </div>
  );
}

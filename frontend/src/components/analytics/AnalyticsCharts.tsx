"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { eventsService, normalizeEvent, BackendEvent } from "@/lib/services/events";
import { Alert } from "@/lib/types";
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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH ALERTS
  const fetchAlerts = useCallback(async () => {
    try {
      const data = await eventsService.getEvents(0, 1000); // Fetch enough to build a good chart
      const uniqueData = data.filter(
        (alert, index, self) => index === self.findIndex((a) => a.id === alert.id)
      );
      setAlerts((prev) => {
        const combined = [...prev, ...uniqueData];
        return combined.filter(
          (alert, index, self) => index === self.findIndex((a) => a.id === alert.id)
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    } catch (err) {
      console.error("Failed to load alerts for analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // WEBSOCKET
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      const token = localStorage.getItem("access_token");
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== "undefined" ? `ws://${window.location.hostname}:8080` : "ws://localhost:8080");
      const wsUrl = token
        ? `${baseUrl}/api/ws/alerts?token=${token}`
        : `${baseUrl}/api/ws/alerts`;
        
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const rawData: BackendEvent = JSON.parse(event.data);
          const newAlert = normalizeEvent(rawData);
          
          setAlerts((prev) => {
            if (prev.some((a) => a.id === newAlert.id)) return prev;
            return [newAlert, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          });
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();
    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  // AGGREGATE DATA
  const { trendData, alertCategories, roomRisk, aiConfidenceTrend, systemHealthTrend } = useMemo(() => {
    if (alerts.length === 0) {
      return { trendData: [], alertCategories: [], roomRisk: [], aiConfidenceTrend: [], systemHealthTrend: [] };
    }

    // Reverse so we process oldest to newest for time series
    const ascending = [...alerts].reverse();
    
    const byType: Record<string, number> = {};
    const roomRiskMap: Record<string, number> = {};
    const timeBuckets: Record<string, { count: number, totalConf: number }> = {};
    
    ascending.forEach(alert => {
      // 1. By Type
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      
      // 2. By Room (Risk calculation: simple count of alerts, weighted by severity)
      const weight = alert.severity === 'critical' ? 10 : alert.severity === 'high' ? 5 : alert.severity === 'medium' ? 2 : 1;
      roomRiskMap[alert.room] = (roomRiskMap[alert.room] || 0) + weight;
      
      // 3. Time bucket (group by 10-minute intervals)
      // alert.timestamp is already formatted like "14:35:22"
      const parts = alert.timestamp.split(':');
      if (parts.length >= 2) {
        const roundedMins = Math.floor(parseInt(parts[1], 10) / 10) * 10;
        const timeKey = `${parts[0]}:${roundedMins.toString().padStart(2, '0')}`;
        
        if (!timeBuckets[timeKey]) timeBuckets[timeKey] = { count: 0, totalConf: 0 };
        timeBuckets[timeKey].count += 1;
        timeBuckets[timeKey].totalConf += alert.confidence;
      }
    });

    const trendData = Object.entries(timeBuckets).map(([time, data]) => ({
      time,
      alerts: data.count
    }));

    const alertCategories = Object.entries(byType).map(([name, value]) => ({ name, value }));
    
    const roomRisk = Object.entries(roomRiskMap).map(([room, risk]) => ({ room, risk }));
    
    const aiConfidenceTrend = Object.entries(timeBuckets).map(([time, data]) => ({
      time,
      confidence: Math.round(data.totalConf / data.count)
    }));
    
    // System health is mock-stable based on the same buckets just to show the line
    const systemHealthTrend = Object.entries(timeBuckets).map(([time, data]) => ({
      time,
      health: Number((99.0 + (Math.random() * 0.9)).toFixed(1))
    }));

    return { trendData, alertCategories, roomRisk, aiConfidenceTrend, systemHealthTrend };
  }, [alerts]);

  if (loading) {
    return <div className="text-center py-10 text-[var(--text-2)]">Loading live analytics...</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <ChartCard title="Alerts Over Time" subtitle="Real-time alert volume across the session" index={0}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trendData.length > 0 ? trendData : [{time: "N/A", alerts: 0}]} margin={{ left: -20, right: 8 }}>
            <defs>
              <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sage)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--sage)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: 'var(--surface-2)', opacity: 0.4 }} />
            <Area type="monotone" dataKey="alerts" stroke="var(--sage)" strokeWidth={3} fill="url(#alertGradient)" activeDot={{ r: 6, fill: "var(--sage)", stroke: "var(--bg)", strokeWidth: 2 }} style={{ cursor: 'pointer' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Alert Categories" subtitle="Live breakdown by detection type" index={1}>
        {alertCategories.length === 0 ? (
          <div className="flex items-center justify-center h-[240px] text-[var(--text-2)]">No alerts detected yet</div>
        ) : (
          <>
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
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--surface)" strokeWidth={2} style={{ cursor: 'pointer', outline: 'none' }} className="hover:opacity-80 transition-opacity duration-300" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {alertCategories.map((c, i) => (
                <span key={c.name} className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {c.name.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </>
        )}
      </ChartCard>

      <ChartCard title="Room Risk" subtitle="Live composite risk score by room" index={2}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={roomRisk.length > 0 ? roomRisk : [{room: "N/A", risk: 0}]} margin={{ left: -20, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="room" tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: 'var(--surface-2)', opacity: 0.4 }} />
            <Bar dataKey="risk" radius={[6, 6, 0, 0]} style={{ cursor: 'pointer' }}>
              {roomRisk.map((r, i) => (
                <Cell key={i} fill={r.risk > 60 ? "var(--red)" : r.risk > 35 ? "var(--amber)" : "var(--sage)"} className="hover:opacity-80 transition-opacity duration-300" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="AI Confidence & System Health" subtitle="Real-time trend across the session" index={3}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={aiConfidenceTrend.length > 0 ? aiConfidenceTrend.map((t, i) => ({ ...t, health: systemHealthTrend[i]?.health || 99.9 })) : [{time: "N/A", confidence: 0, health: 100}]} margin={{ left: -20, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="time" allowDuplicatedCategory={false} tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle()} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="confidence" stroke="var(--blue)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "var(--blue)", stroke: "var(--bg)", strokeWidth: 2 }} name="AI Confidence" style={{ cursor: 'pointer' }} />
            <Line type="monotone" dataKey="health" stroke="var(--sage)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "var(--sage)", stroke: "var(--bg)", strokeWidth: 2 }} name="System Health" style={{ cursor: 'pointer' }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 justify-center text-xs text-[var(--text-2)]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--blue)]" /> AI Confidence (%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--sage)]" /> System Health (%)</span>
        </div>
      </ChartCard>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, RefreshCw } from "lucide-react";
import { Student, Alert } from "@/lib/types";
import { StudentDrawer } from "./StudentDrawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { eventsService, normalizeEvent, BackendEvent } from "@/lib/services/events";

const riskToSeverity: Record<string, string> = { low: "low", medium: "medium", high: "high", critical: "critical" };

export function StudentTable() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH ALERTS
  const fetchAlerts = useCallback(async () => {
    try {
      // Fetch alerts from the REST API to get the historical data
      const data = await eventsService.getEvents(0, 500);
      
      const uniqueData = data.filter(
        (alert, index, self) =>
          index === self.findIndex((a) => a.id === alert.id)
      );

      setAlerts((prev) => {
        const combined = [...prev, ...uniqueData];
        return combined.filter(
          (alert, index, self) =>
            index === self.findIndex((a) => a.id === alert.id)
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    } catch (err) {
      console.error("Failed to load alerts for persons:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // WEBSOCKET FOR REAL-TIME UPDATES
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
            // Prepend new alert and keep sorted by timestamp (newest first)
            return [newAlert, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          });
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      ws.onerror = () => {
         // Silently ignore to avoid console spam (handled elsewhere)
      };

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

  // AGGREGATE STUDENTS FROM ALERTS
  const computedStudents = useMemo(() => {
    const studentMap = new Map<string, Student>();
    
    // Process alerts (assuming they are sorted newest to oldest)
    alerts.forEach((alert) => {
      const sid = alert.studentId;
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          id: sid,
          name: alert.studentName || sid, 
          room: alert.room,
          monitoring: alert.severity === 'critical' || alert.severity === 'high' ? 'flagged' : 'active',
          alerts: 0,
          risk: alert.severity as "low" | "medium" | "high" | "critical", 
          lastActivity: alert.timestamp,
          avatarSeed: sid
        });
      }
      
      const s = studentMap.get(sid)!;
      s.alerts += 1;
      
      // Upgrade risk if this alert is higher severity
      const severities = { critical: 4, high: 3, medium: 2, low: 1 };
      if (severities[alert.severity as keyof typeof severities] > severities[s.risk as keyof typeof severities]) {
          s.risk = alert.severity as "low" | "medium" | "high" | "critical";
          s.monitoring = alert.severity === 'critical' || alert.severity === 'high' ? 'flagged' : 'active';
      }
    });
    
    return Array.from(studentMap.values());
  }, [alerts]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return computedStudents.filter((s) => !q || s.name.toLowerCase().includes(q) || s.room.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [query, computedStudents]);

  return (
    <div>
      <div className="relative max-w-xs mb-5 flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search persons..."
            className="w-full pl-9 pr-3 py-2 rounded-full text-sm glass-surface outline-none focus:border-[var(--sage-light)] placeholder:text-[var(--text-2)]"
          />
        </div>
        {loading && <RefreshCw size={16} className="animate-spin text-[var(--text-2)]" />}
      </div>

      <div className="card-surface overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-[var(--text-2)] border-b">
                <th className="font-medium px-5 py-3">Person ID</th>
                <th className="font-medium px-5 py-3">Name</th>
                <th className="font-medium px-5 py-3">Room</th>
                <th className="font-medium px-5 py-3">Monitoring</th>
                <th className="font-medium px-5 py-3">Alerts</th>
                <th className="font-medium px-5 py-3">Risk</th>
                <th className="font-medium px-5 py-3">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[var(--text-2)]">
                    {loading ? "Loading tracking data..." : "No persons detected or tracked yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5), duration: 0.25 }}
                    onClick={() => setSelected(s)}
                    className="border-b last:border-b-0 cursor-pointer hover:bg-[var(--surface-2)]/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-[var(--text-2)]">{s.id}</td>
                    <td className="px-5 py-3 font-medium">Person - {s.id}</td>
                    <td className="px-5 py-3">{s.room}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs capitalize",
                          s.monitoring === "flagged" && "text-[var(--red)]",
                          s.monitoring === "paused" && "text-[var(--text-2)]"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            s.monitoring === "active" && "bg-[var(--sage)] breathing-dot",
                            s.monitoring === "flagged" && "bg-[var(--red)]",
                            s.monitoring === "paused" && "bg-[var(--text-2)]"
                          )}
                        />
                        {s.monitoring}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono">{s.alerts}</td>
                    <td className="px-5 py-3">
                      <StatusBadge severity={riskToSeverity[s.risk] || s.risk} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--text-2)]">{s.lastActivity}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentDrawer student={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

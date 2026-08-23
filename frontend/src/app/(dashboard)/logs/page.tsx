"use client";

import { useEffect, useState, useRef } from "react";
import { BackendEvent, normalizeSeverity } from "@/lib/services/events";

export default function LogsPage() {
  const [logs, setLogs] = useState<BackendEvent[]>([]);
  const [filter, setFilter] = useState("ALL");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem("access_token");
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== "undefined" ? `ws://${window.location.hostname}:8080` : "ws://localhost:8080");
      const wsUrl = token
        ? `${baseUrl}/api/ws/alerts?token=${token}`
        : `${baseUrl}/api/ws/alerts`;
        
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const rawData: BackendEvent = JSON.parse(event.data);
          setLogs((prev) => [rawData, ...prev].slice(0, 200)); // Limit to 200
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      ws.onerror = (error: any) => {
        if (error && error.message) {
          console.error("WebSocket error in Logs:", error.message);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected in Logs. Reconnecting in 5s...");
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter === "ALL") return true;
    if (filter === "CRITICAL" && normalizeSeverity(log.confidence) === "critical") return true;
    if (filter === "HIGH" && normalizeSeverity(log.confidence) === "high") return true;
    if (filter === "MEDIUM" && normalizeSeverity(log.confidence) === "medium") return true;
    if (filter === "LOW" && normalizeSeverity(log.confidence) === "low") return true;
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">System Logs</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[var(--surface-2)] text-[var(--text)]">
              {logs.length} / 200 Events
            </span>
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1">
            Real-time operational and behavioural event stream
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border bg-[var(--surface)] text-sm"
          >
            <option value="ALL">All Events</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-[var(--text-2)]">Timestamp</th>
                <th className="px-4 py-3 font-medium text-[var(--text-2)]">Type</th>
                <th className="px-4 py-3 font-medium text-[var(--text-2)]">Target</th>
                <th className="px-4 py-3 font-medium text-[var(--text-2)]">Severity</th>
                <th className="px-4 py-3 font-medium text-[var(--text-2)]">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-2)]">
                    Waiting for events...
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => {
                  const severity = normalizeSeverity(log.confidence);
                  const sevColor = 
                    severity === 'critical' ? 'text-red-500 bg-red-500/10' :
                    severity === 'high' ? 'text-orange-500 bg-orange-500/10' :
                    severity === 'medium' ? 'text-yellow-500 bg-yellow-500/10' :
                    'text-slate-500 bg-slate-500/10';

                  return (
                    <tr key={`${log.id}-${i}`} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 font-medium">{log.behaviour_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.student_id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${sevColor}`}>
                          {severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-2)] truncate max-w-md" title={log.explanation}>
                        {log.explanation}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

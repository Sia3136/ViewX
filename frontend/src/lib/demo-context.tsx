"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Alert, ActivityEvent } from "@/lib/types";
import { normalizeEvent, BackendEvent } from "./services/events";

interface AppEventContextValue {
  enabled: boolean;
  toggle: () => void;
  activity: ActivityEvent[];
  liveAlertCount: number;
  pulseSignal: number;
}

const AppEventContext = createContext<AppEventContextValue | undefined>(undefined);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  // Using 'enabled' for UI toggle if needed, defaulting to true for real system
  const [enabled, setEnabled] = useState(true);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [liveAlertCount, setLiveAlertCount] = useState(0);
  const [pulseSignal, setPulseSignal] = useState(0);

  useEffect(() => {
    if (!enabled) return;

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
          const normalizedAlert: Alert = normalizeEvent(rawData);
          
          const newActivity: ActivityEvent = {
            id: normalizedAlert.id,
            label: normalizedAlert.type,
            room: normalizedAlert.room,
            kind: "alert",
            time: normalizedAlert.timestamp,
          };

          setActivity((prev) => [newActivity, ...prev].slice(0, 50));
          setLiveAlertCount((c) => c + 1);
          setPulseSignal((p) => p + 1);
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      ws.onerror = (error: any) => {
        // Only log if it's a meaningful error, browsers often fire empty {} on normal disconnects
        if (error && error.message) {
          console.error("WebSocket error:", error.message);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 5s...");
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((e) => !e), []);

  return (
    <AppEventContext.Provider value={{ enabled, toggle, activity, liveAlertCount, pulseSignal }}>
      {children}
    </AppEventContext.Provider>
  );
}

// Keep the old hook name to minimize breaking changes in UI components
export function useDemoMode() {
  const ctx = useContext(AppEventContext);
  if (!ctx) throw new Error("useDemoMode must be used within AppEventProvider");
  return ctx;
}

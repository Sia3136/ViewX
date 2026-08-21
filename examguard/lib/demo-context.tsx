"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { ActivityEvent } from "@/lib/types";
import { initialActivity } from "@/lib/mock-data/dashboard";

interface DemoContextValue {
  enabled: boolean;
  toggle: () => void;
  activity: ActivityEvent[];
  liveAlertCount: number;
  pulseSignal: number; // increments each simulated event, cameras/badges can react
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

const SIMULATED_EVENTS: Omit<ActivityEvent, "id" | "time">[] = [
  { label: "Phone detected", room: "Room B", kind: "alert" },
  { label: "Unusual head movement", room: "Room A", kind: "detection" },
  { label: "Multiple faces detected", room: "Room D", kind: "alert" },
  { label: "Camera signal restored", room: "Room F", kind: "system" },
  { label: "Object near desk", room: "Room E", kind: "detection" },
  { label: "Alert resolved — false positive", room: "Room C", kind: "resolved" },
  { label: "Monitoring accuracy recalibrated", room: "System", kind: "system" },
  { label: "Student re-entered frame", room: "Room C", kind: "resolved" },
];

function timeNow() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity);
  const [liveAlertCount, setLiveAlertCount] = useState(3);
  const [pulseSignal, setPulseSignal] = useState(0);
  const counterRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const template = SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)];
      counterRef.current += 1;
      const event: ActivityEvent = {
        id: `demo-${Date.now()}-${counterRef.current}`,
        label: template.label,
        room: template.room,
        kind: template.kind,
        time: timeNow(),
      };
      setActivity((prev) => [event, ...prev].slice(0, 20));
      if (template.kind === "alert") {
        setLiveAlertCount((c) => c + 1);
      } else if (template.kind === "resolved") {
        setLiveAlertCount((c) => Math.max(0, c - 1));
      }
      setPulseSignal((p) => p + 1);
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((e) => !e), []);

  return (
    <DemoContext.Provider value={{ enabled, toggle, activity, liveAlertCount, pulseSignal }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoMode must be used within DemoModeProvider");
  return ctx;
}

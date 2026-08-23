"use client";

import LiveSurveillanceDashboard from "@/components/monitoring/LiveSurveillanceDashboard";

export default function MonitoringPage() {
  return (
    <div style={{ margin: "-24px", height: "calc(100vh - 64px)" }}>
      {/* We use negative margin to break out of the padding provided by AppShell if any, and take full height */}
      <LiveSurveillanceDashboard />
    </div>
  );
}

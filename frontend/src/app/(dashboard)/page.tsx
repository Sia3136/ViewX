"use client";

import LiveSurveillanceDashboard from "@/components/monitoring/LiveSurveillanceDashboard";

export default function OverviewPage() {
  return (
    <div style={{ margin: "-24px", height: "calc(100vh - 64px)" }}>
      <LiveSurveillanceDashboard />
    </div>
  );
}
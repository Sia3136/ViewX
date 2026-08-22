import { SystemHealth, ActivityEvent } from "@/lib/types";

export const systemHealth: SystemHealth = {
  studentsMonitored: 482,
  studentsMonitoredDelta: 4.8,
  activeAlerts: 3,
  activeAlertsBreakdown: "2 Medium · 1 High",
  monitoringAccuracy: 97.4,
  monitoringAccuracyDelta: 0.3,
  systemHealth: 99.8,
  systemHealthNote: "All systems operational",
};

export const examBanner = {
  status: "EXAMINATION LIVE",
  subject: "Advanced Mathematics",
  students: 482,
  activeRooms: 12,
  monitorHealth: 96.8,
  activeAlerts: 3,
};

export const initialActivity: ActivityEvent[] = [
  { id: "a1", label: "Unusual head movement", room: "Room A", time: "10:40:49", kind: "detection" },
  { id: "a2", label: "Phone detected", room: "Room B", time: "10:38:12", kind: "alert" },
  { id: "a3", label: "Camera 07 reconnected", room: "Room G", time: "10:35:03", kind: "system" },
  { id: "a4", label: "Alert resolved — false positive", room: "Room C", time: "10:31:44", kind: "resolved" },
  { id: "a5", label: "Multiple faces detected", room: "Room A", time: "10:29:18", kind: "alert" },
  { id: "a6", label: "Monitoring accuracy recalibrated", room: "System", time: "10:22:07", kind: "system" },
];

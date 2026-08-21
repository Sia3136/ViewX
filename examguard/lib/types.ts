export type Severity = "critical" | "high" | "medium" | "low" | "resolved";

export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  room: string;
  studentId: string;
  studentName: string;
  confidence: number;
  timestamp: string;
  description: string;
  status: "open" | "reviewing" | "resolved" | "dismissed" | "escalated";
  evidence?: string;
  aiAnalysis?: string;
  timeline?: { time: string; label: string }[];
}

export interface Detection {
  id: string;
  label: string;
  confidence: number;
  severity: "normal" | "warning" | "critical";
  x: number; // percentage
  y: number;
  w: number;
  h: number;
}

export interface Camera {
  id: string;
  name: string;
  room: string;
  studentCount: number;
  aiConfidence: number;
  fps: number;
  status: "live" | "offline" | "reconnecting";
  alertCount: number;
  detections: Detection[];
}

export interface Student {
  id: string;
  name: string;
  room: string;
  monitoring: "active" | "paused" | "flagged";
  alerts: number;
  risk: "low" | "medium" | "high";
  lastActivity: string;
  avatarSeed: string;
}

export interface ExamSession {
  id: string;
  name: string;
  students: number;
  rooms: number;
  status: "live" | "upcoming" | "completed";
  startTime: string;
  endTime?: string;
}

export interface SystemHealth {
  studentsMonitored: number;
  studentsMonitoredDelta: number;
  activeAlerts: number;
  activeAlertsBreakdown: string;
  monitoringAccuracy: number;
  monitoringAccuracyDelta: number;
  systemHealth: number;
  systemHealthNote: string;
}

export interface ActivityEvent {
  id: string;
  label: string;
  room: string;
  time: string;
  kind: "detection" | "alert" | "system" | "resolved";
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

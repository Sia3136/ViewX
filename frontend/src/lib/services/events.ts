import { api } from "../api";
import { Alert, Severity } from "../types";

export interface BackendEvent {
  id: number;
  student_id: string;
  behaviour_type: string;
  confidence: number;
  explanation: string;
  timestamp: string;
}

export const normalizeSeverity = (confidence: number): Severity => {
  // Severity logic based on confidence threshold.
  // Assuming confidence is a float 0.0 to 1.0 (or 0 to 100). 
  // Wait, backend provides float (0.0 to 1.0)
  if (confidence >= 0.85) return "critical";
  if (confidence >= 0.65) return "high";
  if (confidence >= 0.45) return "medium";
  return "low";
};

export const normalizeEvent = (backendEvent: BackendEvent): Alert => {
  return {
    id: backendEvent.id.toString(),
    type: backendEvent.behaviour_type,
    severity: normalizeSeverity(backendEvent.confidence),
    room: "Unassigned", // Room data unavailable from current backend schema
    studentId: backendEvent.student_id,
    studentName: backendEvent.student_id, // Derived name
    confidence: Math.round(backendEvent.confidence * 100), // Convert to 0-100%
    timestamp: new Date(backendEvent.timestamp).toLocaleTimeString("en-US", { hour12: false }),
    description: backendEvent.explanation,
    status: "open",
    evidence: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/static/snapshots/event_${backendEvent.id}.jpg`,
    aiAnalysis: `AI detected ${backendEvent.behaviour_type} with ${Math.round(backendEvent.confidence * 100)}% confidence.`,
    timeline: [
      { time: new Date(backendEvent.timestamp).toLocaleTimeString(), label: "Event recorded in system" }
    ]
  };
};

export const eventsService = {
  getEvents: async (skip = 0, limit = 100): Promise<Alert[]> => {
    try {
      const response = await api.get('/api/events/', { params: { skip, limit } });
      const data: BackendEvent[] = response.data;
      return data.map(normalizeEvent);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      throw error;
    }
  }
};

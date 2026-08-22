import { Camera } from "@/lib/types";

export const cameras: Camera[] = [
  {
    id: "cam-01",
    name: "Camera 01",
    room: "Room A",
    studentCount: 40,
    aiConfidence: 97,
    fps: 30,
    status: "live",
    alertCount: 1,
    detections: [
      { id: "d1", label: "PERSON", confidence: 96, severity: "normal", x: 18, y: 30, w: 16, h: 30 },
      { id: "d2", label: "PERSON", confidence: 94, severity: "normal", x: 40, y: 28, w: 15, h: 30 },
      { id: "d3", label: "MULTIPLE FACES", confidence: 88, severity: "warning", x: 62, y: 22, w: 20, h: 34 },
    ],
  },
  {
    id: "cam-02",
    name: "Camera 02",
    room: "Room B",
    studentCount: 38,
    aiConfidence: 94,
    fps: 30,
    status: "live",
    alertCount: 2,
    detections: [
      { id: "d4", label: "PERSON", confidence: 95, severity: "normal", x: 12, y: 26, w: 16, h: 32 },
      { id: "d5", label: "PHONE", confidence: 94, severity: "critical", x: 55, y: 34, w: 12, h: 14 },
    ],
  },
  {
    id: "cam-03",
    name: "Camera 03",
    room: "Room C",
    studentCount: 35,
    aiConfidence: 99,
    fps: 25,
    status: "live",
    alertCount: 0,
    detections: [
      { id: "d6", label: "PERSON", confidence: 98, severity: "normal", x: 22, y: 28, w: 15, h: 30 },
      { id: "d7", label: "PERSON", confidence: 97, severity: "normal", x: 48, y: 30, w: 14, h: 28 },
    ],
  },
  {
    id: "cam-04",
    name: "Camera 04",
    room: "Room D",
    studentCount: 42,
    aiConfidence: 96,
    fps: 30,
    status: "live",
    alertCount: 1,
    detections: [
      { id: "d8", label: "PERSON", confidence: 96, severity: "normal", x: 16, y: 28, w: 15, h: 30 },
      { id: "d9", label: "OBJECT", confidence: 88, severity: "warning", x: 58, y: 44, w: 13, h: 12 },
    ],
  },
  {
    id: "cam-05",
    name: "Camera 05",
    room: "Room E",
    studentCount: 39,
    aiConfidence: 98,
    fps: 30,
    status: "live",
    alertCount: 0,
    detections: [
      { id: "d10", label: "PERSON", confidence: 98, severity: "normal", x: 30, y: 26, w: 15, h: 32 },
    ],
  },
  {
    id: "cam-06",
    name: "Camera 06",
    room: "Room F",
    studentCount: 41,
    aiConfidence: 92,
    fps: 24,
    status: "reconnecting",
    alertCount: 0,
    detections: [],
  },
];

export const monitoringHeaderStats = {
  roomsActive: 12,
  examSubject: "Advanced Mathematics",
};

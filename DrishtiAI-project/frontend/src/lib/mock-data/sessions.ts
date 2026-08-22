import { ExamSession } from "@/lib/types";

export const sessions: ExamSession[] = [
  {
    id: "sess-01",
    name: "Advanced Mathematics",
    students: 482,
    rooms: 12,
    status: "live",
    startTime: "09:00 am",
  },
  {
    id: "sess-02",
    name: "Organic Chemistry — Paper II",
    students: 310,
    rooms: 8,
    status: "upcoming",
    startTime: "01:30 pm",
  },
  {
    id: "sess-03",
    name: "Introductory Statistics",
    students: 214,
    rooms: 6,
    status: "upcoming",
    startTime: "04:00 pm",
  },
  {
    id: "sess-04",
    name: "World History — Unit 4",
    students: 268,
    rooms: 7,
    status: "completed",
    startTime: "Yesterday, 09:00 am",
    endTime: "Yesterday, 12:00 pm",
  },
  {
    id: "sess-05",
    name: "Computer Science Fundamentals",
    students: 190,
    rooms: 5,
    status: "completed",
    startTime: "Yesterday, 02:00 pm",
    endTime: "Yesterday, 05:00 pm",
  },
];

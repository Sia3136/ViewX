import { Student } from "@/lib/types";

const names = [
  "Rohan Mehta", "Ishita Verma", "Aditya Rao", "Priya Nair", "Kabir Singh",
  "Ananya Iyer", "Vivaan Kapoor", "Diya Shah", "Arjun Menon", "Sneha Pillai",
  "Kunal Desai", "Meera Joshi", "Rahul Bose", "Tara Chatterjee", "Yash Malhotra",
  "Neha Bhatt", "Dev Patel", "Aisha Khan", "Sameer Gupta", "Riya Sen",
];

const rooms = ["Room A", "Room B", "Room C", "Room D", "Room E", "Room F"];

export const students: Student[] = names.map((name, i) => {
  const risk = i % 7 === 0 ? "high" : i % 3 === 0 ? "medium" : "low";
  const monitoring = i === 5 ? "flagged" : i === 11 ? "paused" : "active";
  return {
    id: `#${(i + 1).toString().padStart(3, "0")}`,
    name,
    room: rooms[i % rooms.length],
    monitoring,
    alerts: risk === "high" ? 3 : risk === "medium" ? 1 : 0,
    risk,
    lastActivity: `${10 - Math.floor(i / 4)}:${(59 - i * 3).toString().padStart(2, "0")}:12`,
    avatarSeed: name,
  };
});

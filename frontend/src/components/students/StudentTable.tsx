"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { students } from "@/lib/mock-data/students";
import { Student } from "@/lib/types";
import { StudentDrawer } from "./StudentDrawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const riskToSeverity: Record<string, string> = {
  low: "low",
  medium: "medium",
  high: "high",
};

export function StudentTable() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return students.filter(
      (s) =>
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-xs mb-5">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-2)]"
        />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search student ID or room..."
          className="w-full pl-9 pr-3 py-2 rounded-full text-sm glass-surface outline-none focus:border-[var(--sage-light)] placeholder:text-[var(--text-2)]"
        />
      </div>

      {/* Student table */}
      <div className="card-surface overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-[var(--text-2)] border-b">
                <th className="font-medium px-5 py-3">
                  Student ID
                </th>

                <th className="font-medium px-5 py-3">
                  Student
                </th>

                <th className="font-medium px-5 py-3">
                  Room
                </th>

                <th className="font-medium px-5 py-3">
                  Monitoring
                </th>

                <th className="font-medium px-5 py-3">
                  Alerts
                </th>

                <th className="font-medium px-5 py-3">
                  Risk
                </th>

                <th className="font-medium px-5 py-3">
                  Last Activity
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: i * 0.02,
                    duration: 0.25,
                  }}
                  onClick={() => setSelected(s)}
                  className="border-b last:border-b-0 cursor-pointer hover:bg-[var(--surface-2)]/50 transition-colors"
                >
                  {/* Student ID */}
                  <td className="px-5 py-3 font-mono text-xs text-[var(--text-2)]">
                    {s.id}
                  </td>

                  {/* Anonymous Student */}
                  <td className="px-5 py-3 font-medium">
                    ST - {String(i + 1).padStart(3, "0")}
                  </td>

                  {/* Room */}
                  <td className="px-5 py-3">
                    {s.room}
                  </td>

                  {/* Monitoring */}
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs capitalize",
                        s.monitoring === "flagged" &&
                          "text-[var(--red)]",
                        s.monitoring === "paused" &&
                          "text-[var(--text-2)]"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          s.monitoring === "active" &&
                            "bg-[var(--sage)] breathing-dot",
                          s.monitoring === "flagged" &&
                            "bg-[var(--red)]",
                          s.monitoring === "paused" &&
                            "bg-[var(--text-2)]"
                        )}
                      />

                      {s.monitoring}
                    </span>
                  </td>

                  {/* Alerts */}
                  <td className="px-5 py-3 font-mono">
                    {s.alerts}
                  </td>

                  {/* Risk */}
                  <td className="px-5 py-3">
                    <StatusBadge
                      severity={riskToSeverity[s.risk]}
                    />
                  </td>

                  {/* Last Activity */}
                  <td className="px-5 py-3 font-mono text-xs text-[var(--text-2)]">
                    {s.lastActivity}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student details */}
      <StudentDrawer
        student={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
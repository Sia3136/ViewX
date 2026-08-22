"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { alerts as mockAlerts } from "@/lib/mock-data/alerts";
import { Alert } from "@/lib/types";
import { AlertCard } from "@/components/alerts/AlertCard";
import { AlertFilters, AlertFilter } from "@/components/alerts/AlertFilters";
import { AlertDrawer } from "@/components/alerts/AlertDrawer";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<AlertFilter>("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Alert | null>(null);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "RESOLVED" ? a.status === "resolved" : a.severity === filter.toLowerCase());
      const q = query.toLowerCase();
      const matchesQuery =
        !q || a.studentName.toLowerCase().includes(q) || a.room.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [alerts, filter, query]);

  function updateStatus(alert: Alert, status: Alert["status"]) {
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, status } : a)));
  }

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Active Alerts</h1>
        <p className="text-[var(--text-2)] mt-2">Review, dismiss, or escalate AI-flagged events in real time.</p>
      </motion.div>

      <AlertFilters active={filter} onChange={setFilter} query={query} onQueryChange={setQuery} />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-2)]">No alerts match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((alert, i) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              index={i}
              onReview={setSelected}
              onDismiss={(a) => updateStatus(a, "dismissed")}
              onEscalate={(a) => updateStatus(a, "escalated")}
            />
          ))}
        </div>
      )}

      <AlertDrawer
        alert={selected}
        onClose={() => setSelected(null)}
        onAction={(a, action) => {
          const statusMap = { confirm: "reviewing", dismiss: "dismissed", escalate: "escalated" } as const;
          updateStatus(a, statusMap[action]);
          setSelected(null);
        }}
      />
    </div>
  );
}

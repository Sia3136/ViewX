"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

import { AlertCard } from "@/components/alerts/AlertCard";
import { AlertDrawer } from "@/components/alerts/AlertDrawer";
import {
  AlertFilters,
  AlertFilter,
} from "@/components/alerts/AlertFilters";

import { Alert } from "@/lib/types";
import { eventsService, normalizeEvent, BackendEvent } from "@/lib/services/events";
import { GlassButton } from "@/components/ui/GlassButton";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const [filter, setFilter] = useState<AlertFilter>("ALL");
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================
  // FETCH ALERTS
  // ============================================================

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);

      const data = await eventsService.getEvents(0, 100);

      // Deduplicate by ID to prevent React key errors
      const uniqueData = data.filter(
        (alert, index, self) =>
          index === self.findIndex((a) => a.id === alert.id)
      );

      setAlerts((prev) => {
        // Merge fetched data with any new WebSocket alerts that might have arrived during the fetch
        const combined = [...prev, ...uniqueData];
        return combined.filter(
          (alert, index, self) =>
            index === self.findIndex((a) => a.id === alert.id)
        );
      });
    } catch (err) {
      console.error("Failed to load alerts:", err);

      setError(
        "Unable to connect to the alert service. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // ============================================================
  // AUTO REFRESH (WEBSOCKET)
  // ============================================================
  //
  // This keeps the Active Alerts page updated in real-time.
  //

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      const token = localStorage.getItem("access_token");
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== "undefined" ? `ws://${window.location.hostname}:8080` : "ws://localhost:8080");
      const wsUrl = token
        ? `${baseUrl}/api/ws/alerts?token=${token}`
        : `${baseUrl}/api/ws/alerts`;
        
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const rawData: BackendEvent = JSON.parse(event.data);
          const newAlert = normalizeEvent(rawData);
          
          // Prepend the new alert to the state instantly (avoiding duplicates)
          setAlerts((prev) => {
            if (prev.some((a) => a.id === newAlert.id)) return prev;
            return [newAlert, ...prev];
          });
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      ws.onerror = (error: any) => {
        if (error && error.message) {
          console.error("WebSocket error in AlertsPage:", error.message);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();
    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, [fetchAlerts]);

  // ============================================================
  // REFRESH BUTTON
  // ============================================================

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  // ============================================================
  // FILTER + SEARCH
  // ============================================================

  const filteredAlerts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return alerts.filter((alert) => {
      // Severity filter
      if (
        filter !== "ALL" &&
        filter !== "RESOLVED" &&
        alert.severity.toUpperCase() !== filter
      ) {
        return false;
      }

      // Resolved filter
      if (filter === "RESOLVED") {
        return (
          alert.status === "resolved" ||
          alert.status === "dismissed"
        );
      }

      // Search
      if (!q) return true;

      return (
        alert.type?.toLowerCase().includes(q) ||
        alert.room?.toLowerCase().includes(q) ||
        alert.studentId?.toLowerCase().includes(q) ||
        alert.description?.toLowerCase().includes(q)
      );
    });
  }, [alerts, filter, query]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleAction = (
  alert: Alert,
  action: "confirm" | "dismiss" | "escalate"
) => {
  console.log(`Alert ${alert.id}: ${action}`);

  setAlerts((prev) =>
    prev.map((item) =>
      item.id === alert.id
        ? {
            ...item,
            status: "resolved",
          }
        : item
    )
  );

  setSelectedAlert(null);
};

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Active Alerts</h1>

          <p className="text-sm text-[var(--text-2)] mt-1">
            Monitoring events detected by the AI system
          </p>
        </div>

        <div className="card-surface flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-[var(--text-2)]">
            <RefreshCw
              size={16}
              className="animate-spin"
            />

            Loading alerts...
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Active Alerts</h1>

          <p className="text-sm text-[var(--text-2)] mt-1">
            Monitoring events detected by the AI system
          </p>
        </div>

        <div className="card-surface flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle
            size={32}
            className="text-[var(--red)] mb-3"
          />

          <h2 className="font-medium mb-1">
            Failed to load alerts
          </h2>

          <p className="text-sm text-[var(--text-2)] max-w-md mb-5">
            {error}
          </p>

          <GlassButton
            variant="secondary"
            onClick={handleRefresh}
          >
            <RefreshCw size={14} className="mr-2" />
            Try Again
          </GlassButton>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              Active Alerts
            </h1>

            {alerts.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[var(--red)]/10 text-[var(--red)]">
                {alerts.length}
              </span>
            )}
          </div>

          <p className="text-sm text-[var(--text-2)] mt-1">
            AI-detected events requiring review
          </p>
        </div>

        <GlassButton
          variant="secondary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin mr-2" : "mr-2"}
          />

          Refresh
        </GlassButton>
      </div>

      {/* FILTERS */}

      <AlertFilters
        active={filter}
        onChange={setFilter}
        query={query}
        onQueryChange={setQuery}
      />

      {/* EMPTY STATE */}

      {filteredAlerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-surface flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
            <AlertCircle
              size={22}
              className="text-[var(--text-2)]"
            />
          </div>

          <h2 className="font-medium">
            {alerts.length === 0
              ? "No alerts detected"
              : "No matching alerts"}
          </h2>

          <p className="text-sm text-[var(--text-2)] mt-1">
            {alerts.length === 0
              ? "The monitoring system has not detected any events yet."
              : "Try changing the filter or search query."}
          </p>
        </motion.div>
      ) : (
        /* ALERT GRID */

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={() => setSelectedAlert(alert)}
            />
          ))}
        </div>
      )}

      {/* DRAWER */}

      <AlertDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAction={handleAction}
      />
    </div>
  );
}
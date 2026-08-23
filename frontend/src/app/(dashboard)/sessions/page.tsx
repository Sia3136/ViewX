"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Video, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { eventsService, BackendEvent } from "@/lib/services/events";
import { Alert } from "@/lib/types";

export default function SessionsPage() {
  const [events, setEvents] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraCount, setCameraCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        // Fetch real events for session analytics
        const evts = await eventsService.getEvents(0, 500);
        
        // Fetch active cameras for session metadata
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/monitoring`;
        const res = await fetch(url);
        let cams = 0;
        if (res.ok) {
          const data = await res.json();
          cams = data.length;
        }

        if (mounted) {
          setEvents(evts);
          setCameraCount(cams);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load session data", err);
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;
  const mediumCount = events.filter(e => e.severity === 'medium').length;

  if (loading) {
    return <div className="p-10 text-[var(--text-2)] text-center">Loading session analytics...</div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Active Session</h1>
        <p className="text-[var(--text-2)] mt-2">Real-time analytics and reporting for the current monitoring session.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard hover={false} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--text-2)] text-sm">
            <Video size={16} /> Active Cameras
          </div>
          <div className="text-3xl font-semibold">{cameraCount > 0 ? cameraCount : '—'}</div>
        </GlassCard>

        <GlassCard hover={false} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertTriangle size={16} /> Critical Events
          </div>
          <div className="text-3xl font-semibold">{criticalCount}</div>
        </GlassCard>

        <GlassCard hover={false} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-orange-500 text-sm">
            <AlertTriangle size={16} /> High Events
          </div>
          <div className="text-3xl font-semibold">{highCount}</div>
        </GlassCard>
        
        <GlassCard hover={false} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--text-2)] text-sm">
            <FileText size={16} /> Total Logged Events
          </div>
          <div className="text-3xl font-semibold">{events.length}</div>
        </GlassCard>
      </div>

      <div>
        <h2 className="text-sm font-mono tracking-wider text-[var(--text-2)] uppercase mb-4 mt-4">Session Event Summary</h2>
        <GlassCard hover={false}>
          {events.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-[var(--text-2)]">
              <CheckCircle2 size={32} className="mb-3 opacity-50 text-[var(--sage)]" />
              <p>No behavioural events recorded in this session yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-2)]">
                    <th className="pb-3 font-medium px-4">Time</th>
                    <th className="pb-3 font-medium px-4">Student</th>
                    <th className="pb-3 font-medium px-4">Behaviour Type</th>
                    <th className="pb-3 font-medium px-4">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {events.slice(0, 50).map((event, i) => (
                    <tr key={`${event.id}-${i}`}>
                      <td className="py-3 px-4 font-mono text-xs">{event.timestamp}</td>
                      <td className="py-3 px-4 font-mono text-xs">{event.studentId}</td>
                      <td className="py-3 px-4">{event.type.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          event.severity === 'critical' ? 'text-red-500 bg-red-500/10' :
                          event.severity === 'high' ? 'text-orange-500 bg-orange-500/10' :
                          event.severity === 'medium' ? 'text-yellow-500 bg-yellow-500/10' :
                          'text-slate-500 bg-slate-500/10'
                        }`}>
                          {event.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Users, MapPin } from "lucide-react";
import { sessions } from "@/lib/mock-data/sessions";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ExamSession } from "@/lib/types";

function SessionCard({ session, index }: { session: ExamSession; index: number }) {
  return (
    <GlassCard initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.35 }}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-medium text-lg pr-3">{session.name}</h3>
        {session.status === "live" && (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-white bg-[var(--sage)] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white breathing-dot" />
            LIVE
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-[var(--text-2)] mb-5">
        <span className="flex items-center gap-1.5">
          <Users size={14} /> {session.students} Students
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={14} /> {session.rooms} Rooms
        </span>
      </div>
      <div className="text-xs text-[var(--text-2)] font-mono mb-5">
        {session.status === "completed" ? `${session.startTime} — ${session.endTime}` : session.startTime}
      </div>
      <div className="flex gap-2">
        {session.status === "live" && (
          <>
            <GlassButton size="sm" variant="primary" className="flex-1">
              View Session
            </GlassButton>
            <GlassButton size="sm" variant="secondary" className="flex-1">
              Session Report
            </GlassButton>
          </>
        )}
        {session.status === "upcoming" && (
          <GlassButton size="sm" variant="primary" className="flex-1">
            Start Monitoring
          </GlassButton>
        )}
        {session.status === "completed" && (
          <GlassButton size="sm" variant="secondary" className="flex-1">
            Session Report
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
}

export default function SessionsPage() {
  const live = sessions.filter((s) => s.status === "live");
  const upcoming = sessions.filter((s) => s.status === "upcoming");
  const completed = sessions.filter((s) => s.status === "completed");

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-10 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Active Sessions</h1>
          <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono mt-1">SIMULATED DATA</span>
        </div>
        <p className="text-[var(--text-2)] mt-2">Manage ongoing and upcoming examination schedules.</p>
      </motion.div>

      {[
        { label: "Live", items: live },
        { label: "Upcoming", items: upcoming },
        { label: "Completed", items: completed },
      ].map(
        (group) =>
          group.items.length > 0 && (
            <div key={group.label}>
              <h2 className="text-sm font-mono tracking-wider text-[var(--text-2)] uppercase mb-4">{group.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {group.items.map((s, i) => (
                  <SessionCard key={s.id} session={s} index={i} />
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}

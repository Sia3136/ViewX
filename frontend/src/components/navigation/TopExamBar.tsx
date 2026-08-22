"use client";

import { useEffect, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useDemoMode } from "@/lib/demo-context";

export function TopExamBar({ onOpenAI }: { onOpenAI?: () => void }) {
  const [time, setTime] = useState<string>("");
  const { liveAlertCount } = useDemoMode();

  useEffect(() => {
    setTime(formatTime(new Date()));
    const id = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sticky top-0 z-20 glass px-4 sm:px-6 py-3 flex items-center gap-4 rounded-b-2xl lg:rounded-2xl lg:mt-4 lg:mx-4">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--sage)] breathing-dot" />
        </span>
        <span className="font-mono tracking-wider text-[var(--sage)] font-semibold hidden sm:inline">EXAM LIVE</span>
        <span className="text-[var(--text-2)] hidden sm:inline">·</span>
        <span className="truncate">Advanced Mathematics · Room A–L</span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="font-mono text-xs px-3 py-1.5 rounded-full glass-surface tabular-nums hidden sm:block">
          {time}
        </div>
        {onOpenAI && (
          <button
            onClick={onOpenAI}
            aria-label="Open ExamGuard AI"
            className="rounded-full p-2 glass-surface hover:border-[var(--sage-light)] transition-colors text-[var(--sage)]"
          >
            <Sparkles size={16} />
          </button>
        )}
        <button aria-label="Notifications" className="relative rounded-full p-2 glass-surface hover:border-[var(--sage-light)] transition-colors">
          <Bell size={16} />
          {liveAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--red)] text-white text-[9px] font-mono flex items-center justify-center">
              {liveAlertCount}
            </span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-[var(--sage)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
          AS
        </div>
      </div>
    </div>
  );
}

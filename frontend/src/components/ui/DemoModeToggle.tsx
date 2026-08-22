"use client";

import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { useDemoMode } from "@/lib/demo-context";
import { cn } from "@/lib/utils";

export function DemoModeToggle() {
  const { enabled, toggle } = useDemoMode();

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-30 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full glass-surface text-xs font-mono font-medium tracking-wide transition-colors",
        enabled ? "border-[var(--sage-light)] text-[var(--sage)]" : "text-[var(--text-2)]"
      )}
      aria-pressed={enabled}
    >
      <span className="relative flex h-2 w-2">
        {enabled && <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--sage)] breathing-dot" />}
        {!enabled && <span className="inline-flex h-full w-full rounded-full bg-[var(--text-2)] opacity-40" />}
      </span>
      <Radio size={13} />
      DEMO MODE {enabled ? "ON" : "OFF"}
    </motion.button>
  );
}

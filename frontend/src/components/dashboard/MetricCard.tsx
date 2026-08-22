"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { LucideIcon, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

export function MetricCard({
  icon: Icon,
  iconColor = "text-[var(--text-2)]",
  value,
  suffix = "",
  label,
  sublabel,
  delta,
  deltaLabel,
  index = 0,
}: {
  icon: LucideIcon;
  iconColor?: string;
  value: number;
  suffix?: string;
  label: string;
  sublabel: string;
  delta?: number;
  deltaLabel?: string;
  index?: number;
}) {
  const [display, setDisplay] = useState(0);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.4,
      delay: 0.15 * index,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, index, motionValue]);

  const formatted = Number.isInteger(value) ? Math.round(display) : display.toFixed(1);

  return (
    <GlassCard
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 * index }}
    >
      <div className="flex items-start justify-between mb-6">
        <Icon size={20} className={iconColor} />
        {delta !== undefined && (
          <span className={cn("flex items-center gap-1 text-xs font-medium", delta >= 0 ? "text-[var(--sage)]" : "text-[var(--red)]")}>
            <TrendingUp size={12} className={delta < 0 ? "rotate-180" : ""} />
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <div className="text-4xl font-semibold tabular-nums tracking-tight">
        {formatted}
        {suffix}
      </div>
      <div className="text-sm font-medium mt-2">{label}</div>
      <div className="text-xs text-[var(--text-2)] mt-0.5">{sublabel}</div>
    </GlassCard>
  );
}

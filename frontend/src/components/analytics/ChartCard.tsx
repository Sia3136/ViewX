"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";

export function ChartCard({
  title,
  subtitle,
  index = 0,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard
      hover={false}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={className}
    >
      <div className="mb-5">
        <h3 className="font-medium">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-2)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </GlassCard>
  );
}

"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  glass?: boolean;
}

export function GlassCard({ className, hover = true, glass = false, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-[18px] border p-6",
        glass ? "glass-surface" : "card-surface",
        hover && "transition-all duration-300",
        className
      )}
      whileHover={hover ? { y: -3, borderColor: "var(--sage-light)" } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

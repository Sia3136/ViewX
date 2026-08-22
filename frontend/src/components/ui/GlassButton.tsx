"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function GlassButton({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: GlassButtonProps) {
  const variants = {
    primary: "bg-[var(--sage)] text-white border-transparent hover:brightness-110",
    secondary: "glass-surface hover:border-[var(--sage-light)]",
    ghost: "bg-transparent border-transparent hover:bg-[var(--surface-2)]",
    danger: "bg-transparent border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "rounded-full font-medium border transition-colors duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

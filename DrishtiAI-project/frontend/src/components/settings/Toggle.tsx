"use client";

import { motion } from "framer-motion";

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b last:border-b-0">
      <div className="pr-4">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-[var(--text-2)] mt-0.5">{description}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200"
        style={{ background: checked ? "var(--sage)" : "var(--surface-2)" }}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </button>
    </div>
  );
}

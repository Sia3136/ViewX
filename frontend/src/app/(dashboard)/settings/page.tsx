"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTheme } from "@/lib/theme-context";
import { Sun, Moon } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-[900px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[var(--text-2)] mt-2">Configure system preferences.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
        <GlassCard hover={false}>
          <div className="flex items-center justify-between py-3.5 border-b last:border-b-0">
            <div>
              <div className="text-sm font-medium">Appearance Theme</div>
              <div className="text-xs text-[var(--text-2)] mt-0.5">Toggle between light and dark modes</div>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-sm font-medium rounded-full transition-colors border border-[var(--border)]"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              {theme === "light" ? "Switch to Dark" : "Switch to Light"}
            </button>
          </div>
        </GlassCard>
      </motion.div>
      
      <div className="text-sm text-[var(--text-2)] text-center mt-8">
        System configuration and monitoring thresholds are currently managed server-side.
      </div>
    </div>
  );
}

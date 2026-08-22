"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Toggle } from "@/components/settings/Toggle";
import { cn } from "@/lib/utils";

const TABS = ["Monitoring", "AI Detection", "Alerts", "Notifications", "Appearance", "Security"] as const;
type Tab = (typeof TABS)[number];

function Slider({ label, value, unit }: { label: string; value: number; unit: string }) {
  const [v, setV] = useState(value);
  return (
    <div className="py-3.5 border-b last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs font-mono text-[var(--text-2)]">
          {v}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="w-full accent-[var(--sage)]"
      />
    </div>
  );
}

function Dropdown({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b last:border-b-0">
      <span className="text-sm font-medium">{label}</span>
      <select className="text-sm glass-surface rounded-full px-3 py-1.5 outline-none focus:border-[var(--sage-light)]">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function TabContent({ tab }: { tab: Tab }) {
  switch (tab) {
    case "Monitoring":
      return (
        <GlassCard hover={false}>
          <Toggle checked label="Continuous face tracking" description="Track student presence and gaze throughout the session" onChange={() => {}} />
          <Toggle checked label="Multi-camera correlation" description="Cross-reference detections across adjacent cameras" onChange={() => {}} />
          <Toggle checked={false} label="Audio monitoring" description="Enable microphone-based anomaly detection" onChange={() => {}} />
          <Dropdown label="Camera resolution" options={["1080p", "720p", "480p"]} />
        </GlassCard>
      );
    case "AI Detection":
      return (
        <GlassCard hover={false}>
          <Slider label="Detection confidence threshold" value={85} unit="%" />
          <Slider label="Phone detection sensitivity" value={90} unit="%" />
          <Slider label="Head movement sensitivity" value={60} unit="%" />
          <Toggle checked label="Object detection" description="Flag unauthorized items near the desk" onChange={() => {}} />
        </GlassCard>
      );
    case "Alerts":
      return (
        <GlassCard hover={false}>
          <Toggle checked label="Auto-escalate critical alerts" description="Notify invigilators immediately for critical severity" onChange={() => {}} />
          <Toggle checked label="Group similar alerts" description="Combine repeated detections from the same student" onChange={() => {}} />
          <Dropdown label="Default alert view" options={["All", "Unresolved", "Critical only"]} />
        </GlassCard>
      );
    case "Notifications":
      return (
        <GlassCard hover={false}>
          <Toggle checked label="Desktop notifications" description="Show alerts as they happen" onChange={() => {}} />
          <Toggle checked={false} label="Email digest" description="Daily summary of monitoring activity" onChange={() => {}} />
          <Toggle checked label="Sound on critical alert" onChange={() => {}} />
        </GlassCard>
      );
    case "Appearance":
      return (
        <GlassCard hover={false}>
          <Toggle checked label="Reduced motion" description="Minimize animations across the interface" onChange={() => {}} />
          <Dropdown label="Density" options={["Comfortable", "Compact"]} />
          <Dropdown label="Accent" options={["Sage", "Blue"]} />
        </GlassCard>
      );
    case "Security":
      return (
        <GlassCard hover={false}>
          <Toggle checked label="Two-factor authentication" onChange={() => {}} />
          <Toggle checked label="Session recording encryption" onChange={() => {}} />
          <Dropdown label="Session timeout" options={["15 minutes", "30 minutes", "1 hour"]} />
        </GlassCard>
      );
  }
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Monitoring");

  return (
    <div className="max-w-[900px] mx-auto flex flex-col gap-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[var(--text-2)] mt-2">Configure monitoring, detection, and alert behavior.</p>
      </motion.div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              tab === t ? "bg-[var(--sage)] text-white border-transparent" : "text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <TabContent tab={tab} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

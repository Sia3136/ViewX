"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid, Eye, BellRing, Users, CalendarClock, BarChart3, FileText, Settings,
  ShieldCheck, ChevronLeft, Moon, Sun,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { useDemoMode } from "@/lib/demo-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/monitoring", label: "Live Monitoring", icon: Eye },
  { href: "/alerts", label: "Active Alerts", icon: BellRing, badge: true },
  { href: "/students", label: "Students", icon: Users },
  { href: "/sessions", label: "Exam Sessions", icon: CalendarClock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function GlassSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { liveAlertCount } = useDemoMode();

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 264 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="hidden lg:flex flex-col shrink-0 h-screen sticky top-0 z-30 glass px-3 py-5"
    >
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-[var(--sage)] flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate">ExamGuard</div>
            <div className="text-[10px] tracking-widest text-[var(--text-2)] font-mono truncate">AI MONITORING</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="ml-auto rounded-full p-1 hover:bg-[var(--surface-2)] transition-colors shrink-0"
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} className="flex">
            <ChevronLeft size={16} />
          </motion.span>
        </button>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative">
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-[var(--sage)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_16px_-4px_var(--sage)]"
                    : "text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.badge && liveAlertCount > 0 && (
                  <span
                    className={cn(
                      "ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                      active ? "bg-white/25 text-white" : "bg-[var(--red)] text-white"
                    )}
                  >
                    {liveAlertCount}
                  </span>
                )}
                {active && !collapsed && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute -left-1 w-1.5 h-1.5 rounded-full bg-white breathing-dot"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-3 mt-3 flex flex-col gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          {!collapsed && <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>}
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[var(--sage)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
            AS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">Dr. Ananya Sharma</div>
              <div className="text-xs text-[var(--text-2)] truncate">Chief Invigilator</div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

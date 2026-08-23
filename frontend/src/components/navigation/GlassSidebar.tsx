"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Eye,
  BellRing,
  Users,
  CalendarClock,
  BarChart3,
  FileText,
  Settings,
  ShieldCheck,
  ChevronLeft,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { useDemoMode } from "@/lib/demo-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutGrid,
  },
  {
    href: "/monitoring",
    label: "Live Monitoring",
    icon: Eye,
  },
  {
    href: "/alerts",
    label: "Active Alerts",
    icon: BellRing,
    badge: true,
  },
  {
    href: "/students",
    label: "Students",
    icon: Users,
  },
  {
    href: "/sessions",
    label: "Exam Sessions",
    icon: CalendarClock,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/logs",
    label: "Logs",
    icon: FileText,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function GlassSidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const { liveAlertCount } = useDemoMode();

  return (
    <motion.aside
      animate={{
        width: collapsed ? 82 : 258,
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="
        hidden
        lg:flex
        flex-col
        shrink-0
        h-screen
        sticky
        top-0
        z-30
        border-r
        bg-[var(--surface)]
        px-3
        py-5
      "
    >
      {/* ===================================================== */}
      {/* BRAND */}
      {/* ===================================================== */}

      <div className="flex items-center gap-3 px-2 mb-8">

        {/* Logo */}
        <div
          className="
            w-9
            h-9
            rounded-xl
            bg-[var(--text)]
            text-[var(--bg)]
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          <ShieldCheck size={18} />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold tracking-tight leading-tight">
              ViewX
            </div>

            <div className="text-[9px] tracking-[0.18em] text-[var(--text-2)] font-mono mt-0.5">
              EXAM MONITORING
            </div>
          </div>
        )}

        {/* Collapse */}
        <button
          onClick={() => setCollapsed((value) => !value)}
          aria-label={
            collapsed
              ? "Expand navigation"
              : "Collapse navigation"
          }
          className="
            ml-auto
            rounded-full
            p-1.5
            text-[var(--text-2)]
            hover:bg-[var(--surface-2)]
            hover:text-[var(--text)]
            transition-colors
            shrink-0
          "
        >
          <motion.span
            animate={{
              rotate: collapsed ? 180 : 0,
            }}
            className="flex"
          >
            <ChevronLeft size={16} />
          </motion.span>
        </button>
      </div>

      {/* ===================================================== */}
      {/* NAVIGATION */}
      {/* ===================================================== */}

      <nav className="flex flex-col gap-1 flex-1">

        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" &&
              pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative"
            >
              <motion.div
                whileHover={{
                  x: collapsed ? 0 : 2,
                }}
                transition={{
                  duration: 0.2,
                }}
                className={cn(
                  `
                    relative
                    flex
                    items-center
                    gap-3
                    px-3
                    py-2.5
                    rounded-xl
                    text-sm
                    font-medium
                    transition-all
                    duration-200
                  `,
                  active
                    ? `
                      bg-[var(--text)]
                      text-[var(--bg)]
                      shadow-sm
                    `
                    : `
                      text-[var(--text-2)]
                      hover:bg-[var(--surface-2)]
                      hover:text-[var(--text)]
                    `
                )}
              >
                <Icon
                  size={18}
                  className="shrink-0"
                />

                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}

                {/* Alert badge */}
                {!collapsed &&
                  item.badge &&
                  liveAlertCount > 0 && (
                    <span
                      className={cn(
                        `
                          ml-auto
                          min-w-5
                          h-5
                          px-1.5
                          rounded-full
                          flex
                          items-center
                          justify-center
                          text-[10px]
                          font-mono
                          font-semibold
                        `,
                        active
                          ? "bg-white/15 text-white"
                          : "bg-red-500 text-white"
                      )}
                    >
                      {liveAlertCount}
                    </span>
                  )}

                {/* Active indicator */}
                {active && !collapsed && (
                  <motion.span
                    layoutId="nav-active"
                    className="
                      absolute
                      -left-[5px]
                      w-1.5
                      h-5
                      rounded-full
                      bg-[var(--text)]
                    "
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* ===================================================== */}
      {/* BOTTOM AREA */}
      {/* ===================================================== */}

      <div className="border-t pt-3 mt-3 flex flex-col gap-2">

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="
            flex
            items-center
            gap-3
            px-3
            py-2.5
            rounded-xl
            text-sm
            text-[var(--text-2)]
            hover:bg-[var(--surface-2)]
            hover:text-[var(--text)]
            transition-colors
          "
        >
          {theme === "light" ? (
            <Moon size={18} />
          ) : (
            <Sun size={18} />
          )}

          {!collapsed && (
            <span>
              {theme === "light"
                ? "Dark mode"
                : "Light mode"}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2">

          <div
            className="
              w-8
              h-8
              rounded-full
              bg-[var(--surface-2)]
              border
              flex
              items-center
              justify-center
              text-xs
              font-semibold
              shrink-0
            "
          >
            AD
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                Administrator
              </div>

              <div className="text-xs text-[var(--text-2)] truncate">
                Monitoring Team
              </div>
            </div>
          )}
        </div>

        {/* Sponsor */}
        {!collapsed && (
          <div className="px-3 pt-2">
            <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--text-2)]">
              Hackathon Sponsor
            </div>

            <div className="text-xs font-medium mt-1">
              DEX-IT Global
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
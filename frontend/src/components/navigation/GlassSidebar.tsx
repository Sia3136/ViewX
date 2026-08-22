"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Video, Users, Activity, FileText, Settings, ChevronLeft, Moon, Sun, BellRing, Shield, } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { useDemoMode } from "@/lib/demo-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/monitoring",
    label: "Live Feeds",
    icon: Video,
  },
  {
    href: "/students",
    label: "Students",
    icon: Users,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: Activity,
  },
  {
    href: "/alerts",
    label: "Event Log",
    icon: BellRing,
    badge: true,
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
        width: collapsed ? 82 : 250,
      }}
      transition={{
        duration: 0.25,
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
        bg-[var(--surface)]
        border-r
        px-3
        py-5
      "
    >
      {/* BRAND */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div
          className="
            w-10 h-10
            rounded-xl
            bg-[var(--text)]
            text-[var(--bg)]
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          <Shield size={19} />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold leading-tight tracking-tight">
              ViewX
            </div>

            <div className="text-[9px] tracking-[0.18em] text-[var(--text-2)] font-mono">
              AI MONITORING
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={
            collapsed
              ? "Expand navigation"
              : "Collapse navigation"
          }
          className="
            ml-auto
            rounded-lg
            p-1.5
            text-[var(--text-2)]
            hover:bg-[var(--surface-2)]
            hover:text-[var(--text)]
            transition-colors
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

      {/* NAVIGATION */}
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
                  `,
                  active
                    ? `
                      bg-[var(--text)]
                      text-[var(--bg)]
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
                        `,
                        active
                          ? "bg-[var(--bg)] text-[var(--text)]"
                          : "bg-[var(--text)] text-[var(--bg)]"
                      )}
                    >
                      {liveAlertCount}
                    </span>
                  )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM */}
      <div className="border-t pt-3 mt-3 flex flex-col gap-2">
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

        {!collapsed && (
          <div className="px-3 pt-2">
            <div className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-3)]">
              Powered by
            </div>

            <div className="font-semibold text-xs mt-1">
              DEX-IT GLOBAL
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
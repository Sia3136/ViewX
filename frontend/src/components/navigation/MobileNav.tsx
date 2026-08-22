"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Eye,
  BellRing,
  Users,
  Menu,
  X,
  CalendarClock,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";
import { useState } from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import { cn } from "@/lib/utils";

const PRIMARY = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutGrid,
  },
  {
    href: "/monitoring",
    label: "Monitoring",
    icon: Eye,
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: BellRing,
    badge: true,
  },
  {
    href: "/students",
    label: "Students",
    icon: Users,
  },
];

const MORE = [
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
    href: "/reports",
    label: "Reports",
    icon: FileText,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const { liveAlertCount } = useDemoMode();

  return (
    <>
      {/* Bottom nav */}
      <nav
        className="
          lg:hidden
          fixed
          bottom-4
          left-4
          right-4
          z-30
          rounded-2xl
          border
          bg-[var(--surface)]
          shadow-xl
          flex
          items-center
          justify-around
          px-2
          py-2
        "
      >
        {PRIMARY.map((item) => {
          const active =
            pathname === item.href;

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1"
            >
              <div
                className={cn(
                  `
                    relative
                    mx-auto
                    flex
                    flex-col
                    items-center
                    gap-1
                    py-2
                    px-3
                    rounded-xl
                    w-fit
                    transition-colors
                  `,
                  active
                    ? "bg-[var(--text)] text-[var(--bg)]"
                    : "text-[var(--text-2)]"
                )}
              >
                <Icon size={18} />

                <span className="text-[9px] font-medium">
                  {item.label}
                </span>

                {item.badge &&
                  liveAlertCount > 0 && (
                    <span
                      className="
                        absolute
                        -top-1
                        -right-1
                        min-w-4
                        h-4
                        px-1
                        rounded-full
                        bg-red-500
                        text-white
                        text-[8px]
                        font-mono
                        flex
                        items-center
                        justify-center
                      "
                    >
                      {liveAlertCount}
                    </span>
                  )}
              </div>
            </Link>
          );
        })}

        <button
          onClick={() => setOpen(true)}
          className="
            flex
            flex-1
            flex-col
            items-center
            gap-1
            py-2
            px-3
            text-[var(--text-2)]
          "
          aria-label="More navigation"
        >
          <Menu size={18} />
          <span className="text-[9px] font-medium">
            More
          </span>
        </button>
      </nav>

      {/* More menu */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="
                lg:hidden
                fixed
                inset-0
                z-40
                bg-black/40
                backdrop-blur-sm
              "
              onClick={() => setOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="
                lg:hidden
                fixed
                bottom-0
                left-0
                right-0
                z-50
                bg-[var(--surface)]
                border-t
                rounded-t-3xl
                p-6
                pb-10
              "
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="font-semibold">
                    ViewX
                  </div>

                  <div className="text-xs text-[var(--text-2)]">
                    Monitoring Console
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="
                    p-2
                    rounded-full
                    hover:bg-[var(--surface-2)]
                  "
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="
                      flex
                      items-center
                      gap-3
                      p-4
                      rounded-xl
                      border
                      bg-[var(--surface-2)]
                      text-sm
                      font-medium
                      hover:bg-[var(--text)]
                      hover:text-[var(--bg)]
                      transition-colors
                    "
                  >
                    <item.icon size={17} />

                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--text-2)]">
                  Hackathon Sponsor
                </div>

                <div className="text-sm font-medium mt-1">
                  DEX-IT Global
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  Users,
  Activity,
  BellRing,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDemoMode } from "@/lib/demo-context";
import { cn } from "@/lib/utils";

const PRIMARY = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/monitoring",
    label: "Feeds",
    icon: Video,
  },
  {
    href: "/students",
    label: "Students",
    icon: Users,
  },
  {
    href: "/alerts",
    label: "Events",
    icon: BellRing,
    badge: true,
  },
];

const MORE = [
  {
    href: "/analytics",
    label: "Analytics",
    icon: Activity,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: Activity,
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
      <nav
        className="
          lg:hidden
          fixed
          bottom-4
          left-4
          right-4
          z-30
          bg-[var(--surface)]
          border
          rounded-2xl
          flex
          items-center
          justify-around
          px-2
          py-2
          shadow-lg
        "
      >
        {PRIMARY.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" &&
              pathname.startsWith(item.href));

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
                  gap-0.5
                  py-2
                  px-3
                  rounded-xl
                  w-fit
                  `,
                  active
                    ? "bg-[var(--text)] text-[var(--bg)]"
                    : "text-[var(--text-2)]"
                )}
              >
                <Icon size={18} />

                {item.badge &&
                  liveAlertCount > 0 && (
                    <span
                      className="
                        absolute
                        -top-1
                        -right-1
                        min-w-4
                        h-4
                        rounded-full
                        bg-[var(--text)]
                        text-[var(--bg)]
                        text-[9px]
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
            flex-1
            flex
            items-center
            justify-center
            py-2
            text-[var(--text-2)]
          "
          aria-label="More navigation"
        >
          <Menu size={20} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="
                lg:hidden
                fixed
                inset-0
                z-40
                bg-black/50
                backdrop-blur-sm
              "
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
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
                <span className="font-semibold">
                  ViewX
                </span>

                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
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
                      gap-2
                      p-4
                      rounded-xl
                      bg-[var(--surface-2)]
                      border
                      text-sm
                      font-medium
                    "
                  >
                    <item.icon size={17} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
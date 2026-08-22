"use client";

import {
  Bell,
  ChevronRight,
  CircleHelp,
  Eye,
  Menu,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { useDemoMode } from "@/lib/demo-context";
import { cn } from "@/lib/utils";

interface TopExamBarProps {
  onOpenAI?: () => void;
}

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Overview";
  if (pathname.startsWith("/monitoring")) return "Live Monitoring";
  if (pathname.startsWith("/alerts")) return "Active Alerts";
  if (pathname.startsWith("/students")) return "Students";
  if (pathname.startsWith("/sessions")) return "Exam Sessions";
  if (pathname.startsWith("/analytics")) return "Analytics";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/settings")) return "Settings";

  return "Dashboard";
}

export function TopExamBar({ onOpenAI }: TopExamBarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { liveAlertCount } = useDemoMode();

  const pageTitle = getPageTitle(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 w-full",
        "border-b border-[var(--border)]",
        "bg-[var(--surface)]/90 backdrop-blur-xl"
      )}
    >
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        {/* Left: brand + breadcrumb */}
        <div className="flex min-w-0 items-center gap-4">
          {/* Mobile menu */}
          <button
            type="button"
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--surface-2)] transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>

          {/* Brand */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--text)] text-[var(--bg)]">
              <Eye size={16} strokeWidth={2.4} />
            </div>

            <div className="leading-none">
              <div className="text-[15px] font-bold tracking-[-0.03em]">
                view<span className="text-[var(--text-2)]">X</span>
              </div>

              <div className="mt-1 text-[8px] font-mono uppercase tracking-[0.18em] text-[var(--text-2)]">
                monitoring
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-[var(--border)]" />

          {/* Breadcrumb */}
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden md:inline text-xs text-[var(--text-2)]">
              viewX
            </span>

            <ChevronRight
              size={13}
              className="hidden md:block text-[var(--text-2)]"
            />

            <span className="truncate text-sm font-semibold tracking-[-0.01em]">
              {pageTitle}
            </span>
          </div>
        </div>

        {/* Center: sponsor */}
        <div className="hidden xl:flex items-center gap-3">
          <div className="h-5 w-px bg-[var(--border)]" />

          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--text-2)]">
              Hackathon partner
            </span>

            <span className="text-xs font-semibold tracking-tight">
              DEX-IT GLOBAL
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Live status */}
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--alert-critical)] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--alert-critical)]" />
            </span>

            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[var(--text-2)]">
              Live
            </span>
          </div>

          {/* Students */}
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2">
            <Users size={14} className="text-[var(--text-2)]" />

            <span className="text-[11px] font-mono text-[var(--text-2)]">
              28
            </span>

            <span className="text-[10px] text-[var(--text-2)]">
              students
            </span>
          </div>

          {/* Alert count */}
          <button
            type="button"
            className={cn(
              "relative flex h-9 items-center gap-2 rounded-xl border px-3",
              "border-[var(--alert-critical-border)]",
              "bg-[var(--alert-critical-bg)]",
              "hover:brightness-95 transition-all"
            )}
            aria-label={`${liveAlertCount} active alerts`}
          >
            <Bell
              size={15}
              className="text-[var(--alert-critical)]"
            />

            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide text-[var(--alert-critical)]">
              Alerts
            </span>

            {liveAlertCount > 0 && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full",
                  "bg-[var(--alert-critical)] text-white",
                  "px-1 text-[9px] font-bold font-mono"
                )}
              >
                {liveAlertCount}
              </span>
            )}
          </button>

          {/* AI help */}
          <button
            type="button"
            onClick={onOpenAI}
            className={cn(
              "hidden sm:flex h-9 w-9 items-center justify-center rounded-xl",
              "border border-[var(--border)]",
              "bg-[var(--surface-2)]/60",
              "text-[var(--text-2)]",
              "hover:text-[var(--text)]",
              "hover:bg-[var(--surface-2)]",
              "transition-colors"
            )}
            aria-label="Open monitoring assistant"
          >
            <CircleHelp size={16} />
          </button>

          {/* Theme */}
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "border border-[var(--border)]",
              "bg-[var(--surface-2)]/60",
              "text-[var(--text-2)]",
              "hover:text-[var(--text)]",
              "hover:bg-[var(--surface-2)]",
              "transition-colors"
            )}
            aria-label={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
          >
            {theme === "light" ? (
              <Moon size={16} />
            ) : (
              <Sun size={16} />
            )}
          </button>

          {/* Operator */}
          <div className="hidden md:flex items-center gap-2 pl-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-semibold">
              OP
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sponsor strip */}
      <div className="xl:hidden flex items-center justify-center border-t border-[var(--border)] px-4 py-1.5">
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-[var(--text-2)]">
          <span>Powered for</span>
          <span className="font-semibold text-[var(--text)]">
            DEX-IT GLOBAL
          </span>
        </div>
      </div>
    </header>
  );
}
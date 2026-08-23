"use client";

import {
  Bell,
  Bot,
  ChevronDown,
  CircleHelp,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { useDemoMode } from "@/lib/demo-context";

export function TopExamBar({
  onOpenAI,
}: {
  onOpenAI: () => void;
}) {
  const { liveAlertCount } = useDemoMode();

  return (
    <header
      className="
        relative
        z-20
        w-full
        border-b
        bg-[var(--surface)]
      "
    >
      <div
        className="
          h-[72px]
          px-4
          sm:px-6
          lg:px-7
          flex
          items-center
          justify-between
          gap-4
        "
      >
        {/* ================================================= */}
        {/* LEFT */}
        {/* ================================================= */}

        <div className="flex items-center gap-4 min-w-0">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2">
            <div
              className="
                w-8
                h-8
                rounded-lg
                bg-[var(--text)]
                text-[var(--bg)]
                flex
                items-center
                justify-center
              "
            >
              <ShieldCheck size={16} />
            </div>

            <span className="font-semibold">
              ViewX
            </span>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-7 bg-[var(--border)]" />

          {/* Page context */}
          <div className="hidden sm:block">
            <div className="text-sm font-semibold">
              Examination Monitoring
            </div>

            <div className="text-[11px] text-[var(--text-2)] mt-0.5">
              Live command center
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* RIGHT */}
        {/* ================================================= */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* Exam status */}
          <div
            className="
              hidden
              md:flex
              items-center
              gap-2
              px-3
              py-2
              rounded-xl
              border
              bg-[var(--surface-2)]
            "
          >
            <span className="relative flex h-2 w-2">
              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  rounded-full
                  bg-emerald-500
                  opacity-60
                  animate-ping
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-500
                "
              />
            </span>

            <span className="text-xs font-medium">
              System Live
            </span>
          </div>

          {/* Time */}
          <div
            className="
              hidden
              xl:flex
              items-center
              gap-2
              text-xs
              text-[var(--text-2)]
              px-2
            "
          >
            <Clock3 size={14} />

            <span className="font-mono">
              LIVE
            </span>
          </div>

          {/* Sponsor */}
          <div
            className="
              hidden
              lg:flex
              items-center
              gap-2
              pl-3
              border-l
            "
          >
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-2)]">
                Powered by
              </div>

              <div className="text-xs font-semibold">
                DEX-IT Global
              </div>
            </div>
          </div>

          {/* Alert notification */}
          <button
            className="
              relative
              w-9
              h-9
              rounded-xl
              border
              flex
              items-center
              justify-center
              text-[var(--text-2)]
              hover:bg-[var(--surface-2)]
              hover:text-[var(--text)]
              transition-colors
            "
            aria-label="View notifications"
          >
            <Bell size={17} />

            {liveAlertCount > 0 && (
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
          </button>

          {/* AI */}
          <button
            onClick={onOpenAI}
            className="
              hidden
              sm:flex
              items-center
              gap-2
              h-9
              px-3
              rounded-xl
              border
              bg-[var(--text)]
              text-[var(--bg)]
              text-xs
              font-medium
              hover:opacity-85
              transition-opacity
            "
          >
            <Bot size={15} />

            <span>
              AI Assistant
            </span>
          </button>

          {/* Help */}
          <button
            className="
              hidden
              md:flex
              w-9
              h-9
              rounded-xl
              border
              items-center
              justify-center
              text-[var(--text-2)]
              hover:bg-[var(--surface-2)]
              hover:text-[var(--text)]
              transition-colors
            "
            aria-label="Help"
          >
            <CircleHelp size={17} />
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* EXAM STATUS STRIP */}
      {/* ================================================= */}

      <div
        className="
          hidden
          md:flex
          items-center
          justify-between
          px-4
          sm:px-6
          lg:px-7
          py-2
          border-t
          bg-[var(--surface-2)]
        "
      >
        <div className="flex items-center gap-4 text-[11px] text-[var(--text-2)]">

          <span>
            SESSION:
            <strong className="ml-1 text-[var(--text)]">
              ACTIVE
            </strong>
          </span>

          <span className="w-px h-3 bg-[var(--border)]" />

          <span>
            MONITORING:
            <strong className="ml-1 text-emerald-600 dark:text-emerald-400">
              OPERATIONAL
            </strong>
          </span>
        </div>

        <button
          onClick={onOpenAI}
          className="
            flex
            items-center
            gap-1
            text-[11px]
            text-[var(--text-2)]
            hover:text-[var(--text)]
            transition-colors
          "
        >
          System status
          <ChevronDown size={12} />
        </button>
      </div>
    </header>
  );
}
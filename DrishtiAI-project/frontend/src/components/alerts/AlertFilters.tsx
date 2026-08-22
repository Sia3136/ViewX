"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "RESOLVED"] as const;
export type AlertFilter = (typeof FILTERS)[number];

export function AlertFilters({
  active,
  onChange,
  query,
  onQueryChange,
}: {
  active: AlertFilter;
  onChange: (f: AlertFilter) => void;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium tracking-wide transition-colors border",
              active === f
                ? "bg-[var(--sage)] text-white border-transparent"
                : "text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface-2)]"
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-2)]" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search student, room or alert..."
          className="w-full pl-9 pr-3 py-2 rounded-full text-sm glass-surface outline-none focus:border-[var(--sage-light)] placeholder:text-[var(--text-2)]"
        />
      </div>
    </div>
  );
}

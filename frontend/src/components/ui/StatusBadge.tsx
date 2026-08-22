import { cn } from "@/lib/utils";
import { Severity } from "@/lib/types";

const styles: Record<string, string> = {
  critical: "bg-[color-mix(in_srgb,var(--red)_16%,transparent)] text-[var(--red)] border-[color-mix(in_srgb,var(--red)_35%,transparent)]",
  high: "bg-[color-mix(in_srgb,var(--red)_12%,transparent)] text-[var(--red)] border-[color-mix(in_srgb,var(--red)_28%,transparent)]",
  medium: "bg-[color-mix(in_srgb,var(--amber)_16%,transparent)] text-[var(--amber)] border-[color-mix(in_srgb,var(--amber)_35%,transparent)]",
  low: "bg-[color-mix(in_srgb,var(--blue)_14%,transparent)] text-[var(--blue)] border-[color-mix(in_srgb,var(--blue)_30%,transparent)]",
  resolved: "bg-[color-mix(in_srgb,var(--sage)_14%,transparent)] text-[var(--sage)] border-[color-mix(in_srgb,var(--sage)_30%,transparent)]",
};

export function StatusBadge({ severity, className }: { severity: Severity | string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wider uppercase border",
        styles[severity] ?? styles.low,
        className
      )}
    >
      {severity}
    </span>
  );
}

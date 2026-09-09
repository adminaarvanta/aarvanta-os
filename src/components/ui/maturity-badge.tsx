import { cn } from "@/lib/utils";
import { MATURITY_LABELS, type MaturityStatus } from "@/lib/product/maturity";

const TONE: Record<MaturityStatus, string> = {
  live: "bg-success/15 text-success ring-success/30",
  beta: "bg-gold/15 text-gold-bright ring-gold/35",
  preview: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  coming_soon: "bg-surface-muted text-muted ring-border",
};

export function MaturityBadge({ status }: { status: MaturityStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        TONE[status]
      )}
    >
      {MATURITY_LABELS[status]}
    </span>
  );
}

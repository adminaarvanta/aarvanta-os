import { cn } from "@/lib/utils";

const VARIANTS = {
  default: "bg-surface-muted text-muted ring-border",
  gold: "bg-gold/10 text-gold-bright ring-gold/25",
  success: "bg-emerald-950/50 text-emerald-300 ring-emerald-800/40",
  warning: "bg-amber-950/50 text-amber-300 ring-amber-800/40",
  danger: "bg-red-950/50 text-red-300 ring-red-800/40",
  info: "bg-sky-950/50 text-sky-300 ring-sky-800/40",
} as const;

export function StatusPill({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

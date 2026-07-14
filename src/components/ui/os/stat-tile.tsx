import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  href,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  href?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          {label}
        </p>
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            "mt-1 text-xs text-muted",
            trend === "up" && "text-accent-cyan",
            trend === "down" && "text-red-400/90"
          )}
        >
          {sub}
        </p>
      )}
    </>
  );

  const classes = cn(
    "group block rounded-xl border border-border bg-surface-elevated p-4 transition-all",
    href &&
      "hover:border-gold/35 hover:bg-surface-hover hover:shadow-[0_0_0_1px_rgba(184, 150, 93,0.08)]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

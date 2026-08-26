import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TILE_TONES = {
  gold: {
    bar: "from-[#a8894f] to-amber-400",
    wash: "from-gold/12 via-surface-elevated to-surface-elevated",
    icon: "bg-gold/15 text-gold ring-1 ring-gold/25",
    hover: "hover:border-gold/40",
  },
  navy: {
    bar: "from-[#1a2f59] to-sky-500",
    wash: "from-sky-500/[0.12] via-surface-elevated to-surface-elevated",
    icon: "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/25 dark:text-sky-200",
    hover: "hover:border-sky-400/40",
  },
  cyan: {
    bar: "from-[#2f7f92] to-cyan-400",
    wash: "from-cyan-500/[0.12] via-surface-elevated to-surface-elevated",
    icon: "bg-cyan-500/15 text-cyan-700 ring-1 ring-cyan-500/25 dark:text-cyan-200",
    hover: "hover:border-cyan-400/40",
  },
  emerald: {
    bar: "from-emerald-500 to-teal-400",
    wash: "from-emerald-500/[0.12] via-surface-elevated to-surface-elevated",
    icon: "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-200",
    hover: "hover:border-emerald-400/40",
  },
  rose: {
    bar: "from-rose-500 to-orange-400",
    wash: "from-rose-500/[0.10] via-surface-elevated to-surface-elevated",
    icon: "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/25 dark:text-rose-200",
    hover: "hover:border-rose-400/40",
  },
} as const;

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  href,
  trend,
  className,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  href?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  tone?: keyof typeof TILE_TONES;
}) {
  const palette = tone ? TILE_TONES[tone] : null;
  const content = (
    <>
      {palette ? <div className={`h-1 bg-gradient-to-r ${palette.bar}`} /> : null}
      <div className={cn("p-4", palette && `bg-gradient-to-b ${palette.wash}`)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              palette ? palette.icon : "bg-gold/10 text-gold"
            )}
          >
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
      </div>
    </>
  );

  const classes = cn(
    "group block overflow-hidden rounded-xl border border-border bg-surface-elevated transition-all",
    href &&
      (palette
        ? `${palette.hover} hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]`
        : "hover:border-gold/35 hover:bg-surface-hover hover:shadow-[0_0_0_1px_rgba(184, 150, 93,0.08)]"),
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

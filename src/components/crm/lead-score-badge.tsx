import { cn } from "@/lib/utils";

export function LeadScoreBadge({
  score,
  className,
  compact,
}: {
  score?: number;
  className?: string;
  compact?: boolean;
}) {
  if (score == null) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted ring-1 ring-border",
          className
        )}
      >
        Unscored
      </span>
    );
  }

  const tone =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 50
        ? "text-amber-700 dark:text-amber-300"
        : "text-muted";
  const bar =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-foreground/30";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={`Lead score ${score}`}
    >
      {!compact ? (
        <span className="h-1.5 w-10 overflow-hidden rounded-full bg-surface-muted ring-1 ring-border">
          <span
            className={cn("block h-full rounded-full", bar)}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </span>
      ) : null}
      <span className={cn("text-xs font-semibold tabular-nums", tone)}>
        {score}
      </span>
    </span>
  );
}

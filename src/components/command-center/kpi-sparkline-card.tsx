export function KpiSparklineCard({
  label,
  value,
  sub,
  spark,
  sparkColor,
}: {
  label: string;
  value: string;
  sub?: string;
  spark?: number[];
  sparkColor?: string;
  color?: string;
}) {
  const hasSpark =
    Boolean(sparkColor) &&
    Array.isArray(spark) &&
    spark.length > 1 &&
    spark.some((n) => n !== 0);

  const points = hasSpark
    ? spark!
        .map((n, i) => {
          const max = Math.max(...spark!, 1);
          const x = (i / (spark!.length - 1)) * 100;
          const y = 22 - (n / max) * 18;
          return `${x},${y}`;
        })
        .join(" ")
    : "";

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-muted">{sub}</p> : null}
      {hasSpark ? (
        <svg viewBox="0 0 100 24" className="mt-3 h-6 w-full" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={sparkColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      ) : null}
    </div>
  );
}

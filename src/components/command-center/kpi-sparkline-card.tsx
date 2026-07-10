export function KpiSparklineCard({
  label,
  value,
  delta,
  sparkColor,
}: {
  label: string;
  value: string;
  delta: string;
  color: string;
  sparkColor: string;
}) {
  const points = "0,22 14,18 28,20 42,12 56,14 70,8 84,10 100,4";

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{delta} vs last 30 days</p>
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
    </div>
  );
}

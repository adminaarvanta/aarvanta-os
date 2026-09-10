import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-elevated",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </>
  );
  const className =
    "block rounded-xl border border-border bg-surface-elevated p-4";
  if (href) {
    return (
      <a href={href} className={`${className} transition-colors hover:border-gold/40`}>
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}

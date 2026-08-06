import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type VoiceTone =
  | "navy"
  | "gold"
  | "cyan"
  | "green"
  | "blue"
  | "amber"
  | "rose"
  | "slate";

const toneStyles: Record<
  VoiceTone,
  { chip: string; soft: string; text: string; bar: string; ring: string }
> = {
  navy: {
    chip: "bg-[var(--primary-soft)] text-[var(--navy)] dark:text-gold-bright",
    soft: "from-[rgba(26,47,89,0.12)] to-transparent",
    text: "text-[var(--navy)] dark:text-gold-bright",
    bar: "bg-[var(--navy)] dark:bg-gold",
    ring: "ring-[rgba(26,47,89,0.2)]",
  },
  gold: {
    chip: "bg-[rgba(168,137,79,0.16)] text-gold-dark dark:text-gold-bright",
    soft: "from-[rgba(168,137,79,0.18)] to-transparent",
    text: "text-gold-dark dark:text-gold-bright",
    bar: "bg-gold",
    ring: "ring-[rgba(168,137,79,0.25)]",
  },
  cyan: {
    chip: "bg-[var(--chart-ops-soft)] text-[var(--chart-ops)]",
    soft: "from-[var(--chart-ops-soft)] to-transparent",
    text: "text-[var(--chart-ops)]",
    bar: "bg-[var(--chart-ops)]",
    ring: "ring-[rgba(14,165,198,0.25)]",
  },
  green: {
    chip: "bg-[var(--chart-ai-soft)] text-[var(--chart-ai)]",
    soft: "from-[var(--chart-ai-soft)] to-transparent",
    text: "text-[var(--chart-ai)]",
    bar: "bg-[var(--chart-ai)]",
    ring: "ring-[rgba(18,163,106,0.25)]",
  },
  blue: {
    chip: "bg-[var(--chart-pipeline-soft)] text-[var(--chart-pipeline)]",
    soft: "from-[var(--chart-pipeline-soft)] to-transparent",
    text: "text-[var(--chart-pipeline)]",
    bar: "bg-[var(--chart-pipeline)]",
    ring: "ring-[rgba(30,79,214,0.25)]",
  },
  amber: {
    chip: "bg-[var(--chart-revenue-soft)] text-[var(--chart-revenue)]",
    soft: "from-[var(--chart-revenue-soft)] to-transparent",
    text: "text-[var(--chart-revenue)]",
    bar: "bg-[var(--chart-revenue)]",
    ring: "ring-[rgba(201,162,39,0.3)]",
  },
  rose: {
    chip: "bg-[rgba(220,38,38,0.12)] text-[var(--chart-lost)]",
    soft: "from-[rgba(220,38,38,0.12)] to-transparent",
    text: "text-[var(--chart-lost)]",
    bar: "bg-[var(--chart-lost)]",
    ring: "ring-[rgba(220,38,38,0.2)]",
  },
  slate: {
    chip: "bg-surface-muted text-muted",
    soft: "from-surface-muted to-transparent",
    text: "text-muted",
    bar: "bg-border",
    ring: "ring-border",
  },
};

export function voiceToneForStatus(status: string): VoiceTone {
  switch (status) {
    case "running":
    case "calling":
    case "in_progress":
      return "cyan";
    case "booked_meeting":
    case "meeting_booked":
    case "completed":
    case "sent":
      return "green";
    case "pending":
    case "draft":
    case "scheduled":
      return "blue";
    case "busy":
    case "callback_requested":
    case "paused":
    case "voicemail":
    case "no_answer":
      return "amber";
    case "failed":
    case "cancelled":
    case "not_interested":
    case "wrong_number":
    case "skipped":
      return "rose";
    default:
      return "slate";
  }
}

export function VoicePageShell({
  title,
  subtitle,
  actions,
  children,
  tone = "navy",
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  tone?: VoiceTone;
}) {
  return (
    <>
      <header className="relative shrink-0 overflow-hidden border-b border-border bg-surface-elevated px-4 py-4 sm:px-6 sm:py-5">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-r opacity-90",
            toneStyles[tone].soft
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-1",
            toneStyles[tone].bar
          )}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Voice OS
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>
      <div className="relative flex-1 bg-[radial-gradient(circle_at_top_left,var(--dot-grid)_1px,transparent_1px)] bg-[size:18px_18px]">
        {children}
      </div>
    </>
  );
}

export function VoicePrimaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gold-dark to-gold px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function VoiceKpiCard({
  label,
  value,
  hint,
  tone = "navy",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: VoiceTone;
}) {
  const t = toneStyles[tone];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm ring-1",
        t.ring
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1.5 rounded-l-2xl",
          t.bar
        )}
      />
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", t.soft)} />
      <div className="relative pl-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {hint ? <p className={cn("mt-1 text-xs font-medium", t.text)}>{hint}</p> : null}
      </div>
    </div>
  );
}

export function VoiceStatChip({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: VoiceTone;
}) {
  const t = toneStyles[tone];
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 px-3 py-3 text-center shadow-sm",
        t.chip
      )}
    >
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
    </div>
  );
}

export function VoiceStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = voiceToneForStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        toneStyles[tone].chip,
        className
      )}
    >
      <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", toneStyles[tone].bar)} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function VoicePanel({
  title,
  children,
  tone = "navy",
  action,
  className,
}: {
  title: string;
  children: ReactNode;
  tone?: VoiceTone;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", toneStyles[tone].bar)} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function VoiceEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-lg">
        ◎
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

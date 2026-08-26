import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Workflows OS — same layout language as AI Workforce, with colorful accents. */
export function WorkflowShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "workflow-os flex min-h-0 flex-1 flex-col overflow-hidden",
        className
      )}
      style={
        {
          "--flow-bg": "#F7F8FC",
          "--flow-panel": "#FFFFFF",
          "--flow-ink": "#0E1525",
          "--flow-muted": "#6B7280",
          "--flow-line": "#E8EAF0",
          "--flow-accent": "#5A42F5",
          "--flow-accent-soft": "#EEF0FF",
          "--flow-accent-deep": "#4630D9",
          "--flow-cyan": "#0891B2",
          "--flow-cyan-soft": "#CFFAFE",
          "--flow-emerald": "#059669",
          "--flow-emerald-soft": "#D1FAE5",
          "--flow-amber": "#D97706",
          "--flow-amber-soft": "#FEF3C7",
          "--flow-rose": "#E11D48",
          "--flow-rose-soft": "#FFE4E6",
          "--flow-ok": "#16A34A",
          "--flow-ok-soft": "#DCFCE7",
          "--flow-wait": "#F59E0B",
          "--flow-wait-soft": "#FEF3C7",
          "--flow-danger": "#DC2626",
          "--flow-danger-soft": "#FEE2E2",
          background: "var(--flow-bg)",
          color: "var(--flow-ink)",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function FlowHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header
      className="shrink-0 px-5 py-5 sm:px-8"
      style={{ background: "var(--flow-bg)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className="text-[22px] font-bold tracking-tight"
            style={{ color: "var(--flow-ink)" }}
          >
            {title}
          </h2>
          {subtitle ? (
            <div
              className="mt-0.5 text-sm"
              style={{ color: "var(--flow-muted)" }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions}
      </div>
    </header>
  );
}

export function FlowPanel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-[var(--flow-panel)] p-5 shadow-[0_1px_3px_rgba(14,21,37,0.04)]",
        className
      )}
      style={{ borderColor: "var(--flow-line)", ...style }}
    >
      {children}
    </div>
  );
}

export function FlowPrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50",
        className
      )}
      style={{ background: "var(--flow-accent)" }}
      {...props}
    >
      {children}
    </button>
  );
}

export function FlowSecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:bg-black/[0.03] disabled:opacity-50",
        className
      )}
      style={{ borderColor: "var(--flow-accent)", color: "var(--flow-accent)" }}
      {...props}
    >
      {children}
    </button>
  );
}

export function FlowChip({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "cyan" | "emerald" | "amber" | "rose" | "ok" | "wait" | "danger" | "muted";
}) {
  const map: Record<string, { bg: string; fg: string }> = {
    accent: { bg: "var(--flow-accent-soft)", fg: "var(--flow-accent)" },
    cyan: { bg: "var(--flow-cyan-soft)", fg: "var(--flow-cyan)" },
    emerald: { bg: "var(--flow-emerald-soft)", fg: "var(--flow-emerald)" },
    amber: { bg: "var(--flow-amber-soft)", fg: "var(--flow-amber)" },
    rose: { bg: "var(--flow-rose-soft)", fg: "var(--flow-rose)" },
    ok: { bg: "var(--flow-ok-soft)", fg: "var(--flow-ok)" },
    wait: { bg: "var(--flow-wait-soft)", fg: "var(--flow-wait)" },
    danger: { bg: "var(--flow-danger-soft)", fg: "var(--flow-danger)" },
    muted: { bg: "#F3F4F6", fg: "var(--flow-muted)" },
  };
  const c = map[tone] ?? map.accent!;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

export function tagTone(
  tag: string
): "accent" | "cyan" | "emerald" | "amber" | "rose" | "muted" {
  const t = tag.toLowerCase();
  if (t.includes("whatsapp") || t.includes("outreach")) return "emerald";
  if (t.includes("meeting") || t.includes("call")) return "amber";
  if (t.includes("pipeline") || t.includes("deal")) return "cyan";
  if (t.includes("approval") || t.includes("handoff")) return "rose";
  if (t.includes("bdm") || t.includes("crm")) return "accent";
  return "muted";
}

export const flowInputClass =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--flow-accent)]";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Aarvanta workforce design language — purple / white / soft gray. */
export function WorkforceShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "workforce-os flex min-h-0 flex-1 flex-col overflow-hidden",
        className
      )}
      style={
        {
          "--wf-bg": "#F8F9FC",
          "--wf-panel": "#FFFFFF",
          "--wf-ink": "#0E1525",
          "--wf-muted": "#6B7280",
          "--wf-line": "#E8EAF0",
          "--wf-accent": "#5A42F5",
          "--wf-accent-soft": "#EEF0FF",
          "--wf-accent-deep": "#4630D9",
          "--wf-ok": "#16A34A",
          "--wf-ok-soft": "#DCFCE7",
          "--wf-wait": "#F59E0B",
          "--wf-wait-soft": "#FEF3C7",
          "--wf-danger": "#DC2626",
          "--wf-danger-soft": "#FEE2E2",
          background: "var(--wf-bg)",
          color: "var(--wf-ink)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function WfHeader({
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
      style={{ background: "var(--wf-bg)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className="text-[22px] font-bold tracking-tight"
            style={{ color: "var(--wf-ink)" }}
          >
            {title}
          </h2>
          {subtitle ? (
            <div className="mt-0.5 text-sm" style={{ color: "var(--wf-muted)" }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions}
      </div>
    </header>
  );
}

export function WfPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(14,21,37,0.04)]", className)}
      style={{ borderColor: "var(--wf-line)" }}
    >
      {children}
    </div>
  );
}

export function WfPrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50",
        className
      )}
      style={{ background: "var(--wf-accent)" }}
      {...props}
    >
      {children}
    </button>
  );
}

export function WfSecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:bg-black/[0.03] disabled:opacity-50",
        className
      )}
      style={{ borderColor: "var(--wf-accent)", color: "var(--wf-accent)" }}
      {...props}
    >
      {children}
    </button>
  );
}

import type { CSSProperties, ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const autoTokens = {
  "--flow-bg": "transparent",
  "--flow-panel": "var(--surface-elevated)",
  "--flow-ink": "var(--foreground)",
  "--flow-muted": "var(--text-muted)",
  "--flow-line": "var(--border)",
  "--flow-accent": "#6D5EF6",
  "--flow-accent-soft": "rgba(109, 94, 246, 0.14)",
  "--flow-accent-deep": "#5246D6",
  "--flow-cyan": "#0E9BB5",
  "--flow-cyan-soft": "rgba(14, 155, 181, 0.16)",
  "--flow-emerald": "#0F9F6E",
  "--flow-emerald-soft": "rgba(15, 159, 110, 0.16)",
  "--flow-amber": "#D97706",
  "--flow-amber-soft": "rgba(217, 119, 6, 0.16)",
  "--flow-rose": "#E11D48",
  "--flow-rose-soft": "rgba(225, 29, 72, 0.14)",
  "--flow-ok": "#16A34A",
  "--flow-ok-soft": "rgba(22, 163, 74, 0.16)",
  "--flow-wait": "#D97706",
  "--flow-wait-soft": "rgba(217, 119, 6, 0.16)",
  "--flow-danger": "#DC2626",
  "--flow-danger-soft": "rgba(220, 38, 38, 0.14)",
  "--wf-bg": "transparent",
  "--wf-panel": "var(--surface-elevated)",
  "--wf-ink": "var(--foreground)",
  "--wf-muted": "var(--text-muted)",
  "--wf-line": "var(--border)",
  "--wf-accent": "#6D5EF6",
  "--wf-accent-soft": "rgba(109, 94, 246, 0.14)",
  "--wf-accent-deep": "#5246D6",
  "--wf-ok": "#16A34A",
  "--wf-ok-soft": "rgba(22, 163, 74, 0.16)",
  "--wf-wait": "#D97706",
  "--wf-wait-soft": "rgba(217, 119, 6, 0.16)",
  "--wf-danger": "#DC2626",
  "--wf-danger-soft": "rgba(220, 38, 38, 0.14)",
} as CSSProperties;

export function AutomationShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "automation-os relative flex min-h-0 flex-1 flex-col overflow-hidden",
        className
      )}
      style={autoTokens}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(109,94,246,0.18),_transparent_42%),radial-gradient(ellipse_at_top_right,_rgba(14,155,181,0.14),_transparent_38%),radial-gradient(ellipse_at_bottom,_rgba(15,159,110,0.08),_transparent_46%)]"
      />
      <div className="relative flex min-h-0 flex-1 flex-col bg-background/40">
        {children}
      </div>
    </div>
  );
}

export function AutomationHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="relative shrink-0 overflow-hidden px-5 pb-4 pt-5 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10" />
      <div className="relative mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-[0_8px_20px_rgba(109,94,246,0.28)]">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
              Automation OS
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {subtitle ? (
              <div className="mt-1 max-w-xl text-sm text-muted">{subtitle}</div>
            ) : null}
          </div>
        </div>
        {actions}
      </div>
    </header>
  );
}

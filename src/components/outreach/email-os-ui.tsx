import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { EmailOsNav } from "@/components/outreach/email-os-nav";
import { cn } from "@/lib/utils";

const SECTION_ACCENTS = {
  cyan: {
    bar: "from-[#2f7f92] to-cyan-400",
    wash: "from-cyan-500/[0.10] via-surface-elevated to-surface-elevated",
    icon: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-200",
  },
  navy: {
    bar: "from-[#1a2f59] to-sky-500",
    wash: "from-sky-500/[0.10] via-surface-elevated to-surface-elevated",
    icon: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  },
  gold: {
    bar: "from-[#a8894f] to-[#2f7f92]",
    wash: "from-gold/10 via-surface-elevated to-surface-elevated",
    icon: "bg-gold/15 text-gold",
  },
  emerald: {
    bar: "from-emerald-500 to-teal-400",
    wash: "from-emerald-500/[0.10] via-surface-elevated to-surface-elevated",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  },
  rose: {
    bar: "from-rose-500 to-orange-400",
    wash: "from-rose-500/[0.08] via-surface-elevated to-surface-elevated",
    icon: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  },
  amber: {
    bar: "from-amber-500 to-orange-400",
    wash: "from-amber-500/[0.10] via-surface-elevated to-surface-elevated",
    icon: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  },
} as const;

export type EmailAccent = keyof typeof SECTION_ACCENTS;

const STATUS_TONES: Record<string, string> = {
  draft: "bg-surface-muted text-muted ring-border",
  scheduled: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-200",
  running: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-200",
  paused: "bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:text-amber-200",
  completed: "bg-cyan-500/12 text-cyan-700 ring-cyan-500/25 dark:text-cyan-200",
  cancelled: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-200",
  pending: "bg-surface-muted text-muted ring-border",
  sending: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-200",
  sent: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-200",
  delivered: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-200",
  opened: "bg-cyan-500/12 text-cyan-700 ring-cyan-500/25 dark:text-cyan-200",
  clicked: "bg-gold/15 text-gold ring-gold/30",
  bounced: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-200",
  blocked: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-200",
  spam: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-200",
  failed: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-200",
  skipped: "bg-surface-muted text-muted ring-border",
  unsubscribed: "bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:text-amber-200",
};

export function EmailAtmosphere({ children }: { children: ReactNode }) {
  return (
    <div className="email-os relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(47,127,146,0.18),_transparent_42%),radial-gradient(ellipse_at_top_right,_rgba(168,137,79,0.14),_transparent_38%),radial-gradient(ellipse_at_bottom,_rgba(26,47,89,0.12),_transparent_46%)]"
      />
      <div className="relative flex min-h-0 flex-1 flex-col bg-background/40">
        {children}
      </div>
    </div>
  );
}

export function EmailPageShell({
  title,
  subtitle,
  description,
  actions,
  back,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  children: ReactNode;
  /** @deprecated Kept so existing callers still type-check. */
  tone?: string;
}) {
  return (
    <>
      <header className="relative shrink-0 overflow-hidden px-5 pb-4 pt-5 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#2f7f92]/12 via-transparent to-[#1a2f59]/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {back}
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f7f92] to-[#1a2f59] text-white shadow-[0_8px_20px_rgba(47,127,146,0.28)] ring-1 ring-gold/35">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
                  Email OS
                </p>
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                {subtitle || description ? (
                  <div className="mt-1 max-w-2xl text-sm text-muted">
                    {description ?? subtitle}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
      <EmailOsNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="space-y-6">{children}</div>
      </div>
    </>
  );
}

export function EmailPrimaryButton({
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
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#2f7f92] to-[#1a2f59] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(47,127,146,0.28)] transition hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function EmailBackLink({
  href,
  children,
  label,
}: {
  href: string;
  children?: ReactNode;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-cyan-700 dark:hover:text-cyan-300"
    >
      <ArrowLeft className="h-3 w-3" aria-hidden />
      {label ?? children}
    </Link>
  );
}

export function EmailSection({
  title,
  action,
  flush,
  accent = "cyan",
  children,
}: {
  title: string;
  action?: ReactNode;
  flush?: boolean;
  accent?: EmailAccent;
  children: ReactNode;
}) {
  const palette = SECTION_ACCENTS[accent];
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className={`h-1.5 bg-gradient-to-r ${palette.bar}`} />
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3",
          `bg-gradient-to-r ${palette.wash}`
        )}
      >
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/** @deprecated Use EmailSection. Kept for existing pages during the restyle. */
export const EmailPanel = EmailSection;

export function EmailEmptyState({
  icon: Icon = Mail,
  title,
  body,
  description,
  action,
  accent = "cyan",
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  description?: string;
  action?: ReactNode;
  accent?: EmailAccent;
}) {
  const palette = SECTION_ACCENTS[accent];
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-elevated/50 px-6 py-14 text-center">
      <span
        className={cn(
          "mb-3 flex h-11 w-11 items-center justify-center rounded-2xl",
          palette.icon
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        {description ?? body}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function EmailStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone =
    STATUS_TONES[status] ?? "bg-surface-muted text-muted ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ring-1",
        tone,
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

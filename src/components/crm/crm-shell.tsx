import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Handshake } from "lucide-react";
import { CrmNav } from "@/components/crm/crm-nav";
import { cn } from "@/lib/utils";

const AVATAR_TONES = [
  "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
  "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
] as const;

export function crmInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function crmAvatarTone(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

export function CrmAvatar({
  name,
  seed,
  size = "md",
  className,
}: {
  name: string;
  seed?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "sm"
      ? "h-8 w-8 text-[10px]"
      : size === "lg"
        ? "h-12 w-12 text-sm"
        : "h-10 w-10 text-xs";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        dim,
        crmAvatarTone(seed || name),
        className
      )}
    >
      {crmInitials(name)}
    </span>
  );
}

export function formatCrmMoney(value: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CrmBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-gold"
    >
      <ArrowLeft className="h-3 w-3" aria-hidden />
      {label}
    </Link>
  );
}

export function CrmShell({
  title,
  description,
  actions,
  back,
  lead,
  wide,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  lead?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <header className="shrink-0 border-b border-border/80 bg-surface-elevated/85 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {back}
            <div className="flex items-start gap-3">
              {lead ?? (
                <span className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-gold/20 sm:flex">
                  <Handshake className="h-5 w-5" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  CRM OS
                </p>
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                {description ? (
                  <div className="mt-1 max-w-2xl text-sm text-muted">
                    {description}
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
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background p-4 sm:p-6">
        <div
          className={cn("space-y-6", wide ? "max-w-none" : "mx-auto max-w-6xl")}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export function CrmToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-surface-elevated/80 p-2.5">
      {children}
    </div>
  );
}

export function CrmFacet({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-gold text-black shadow-sm"
          : "border border-border bg-background text-muted hover:border-gold/40 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function CrmEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-elevated/50 px-6 py-14 text-center">
      {Icon ? (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      ) : null}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function CrmSection({
  title,
  action,
  flush,
  children,
}: {
  title: string;
  action?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function CrmTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted ring-1 ring-border">
      {children}
    </span>
  );
}

export function CrmDetailList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="space-y-3 text-sm">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

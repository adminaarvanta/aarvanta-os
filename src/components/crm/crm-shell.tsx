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

export function CrmAtmosphere({ children }: { children: ReactNode }) {
  return (
    <div className="crm-os relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(26,47,89,0.16),_transparent_42%),radial-gradient(ellipse_at_top_right,_rgba(168,137,79,0.14),_transparent_38%),radial-gradient(ellipse_at_bottom,_rgba(47,127,146,0.10),_transparent_46%)]"
      />
      <div className="relative flex min-h-0 flex-1 flex-col bg-background/40">
        {children}
      </div>
    </div>
  );
}

export function CrmShell({
  title,
  description,
  actions,
  back,
  lead,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  lead?: ReactNode;
  /** @deprecated Full-bleed is the default. Kept so existing callers still type-check. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <header className="relative shrink-0 overflow-hidden px-5 pb-4 pt-5 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a2f59]/10 via-transparent to-[#2f7f92]/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {back}
            <div className="flex min-w-0 items-start gap-3">
              {lead ?? (
                <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2f59] to-[#2f7f92] text-white shadow-[0_8px_20px_rgba(26,47,89,0.28)] ring-1 ring-gold/35">
                  <Handshake className="h-5 w-5" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="space-y-6">{children}</div>
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

const SECTION_ACCENTS = {
  gold: {
    bar: "from-[#a8894f] to-[#2f7f92]",
    wash: "from-gold/10 via-surface-elevated to-surface-elevated",
    icon: "bg-gold/15 text-gold",
  },
  navy: {
    bar: "from-[#1a2f59] to-sky-500",
    wash: "from-sky-500/[0.10] via-surface-elevated to-surface-elevated",
    icon: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
  },
  cyan: {
    bar: "from-[#2f7f92] to-cyan-400",
    wash: "from-cyan-500/[0.10] via-surface-elevated to-surface-elevated",
    icon: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-200",
  },
  rose: {
    bar: "from-rose-500 to-orange-400",
    wash: "from-rose-500/[0.08] via-surface-elevated to-surface-elevated",
    icon: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
  },
  emerald: {
    bar: "from-emerald-500 to-teal-400",
    wash: "from-emerald-500/[0.10] via-surface-elevated to-surface-elevated",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
  },
  violet: {
    bar: "from-violet-500 to-cyan-500",
    wash: "from-violet-500/[0.08] via-surface-elevated to-gold/8",
    icon: "bg-violet-500/15 text-violet-700 dark:text-violet-200",
  },
} as const;

export type CrmAccent = keyof typeof SECTION_ACCENTS;

export function CrmEmptyState({
  icon: Icon,
  title,
  description,
  action,
  accent = "gold",
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  accent?: CrmAccent;
}) {
  const palette = SECTION_ACCENTS[accent];
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-elevated/50 px-6 py-14 text-center">
      {Icon ? (
        <span
          className={cn(
            "mb-3 flex h-11 w-11 items-center justify-center rounded-2xl",
            palette.icon
          )}
        >
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
  accent,
  children,
}: {
  title: string;
  action?: ReactNode;
  flush?: boolean;
  accent?: CrmAccent;
  children: ReactNode;
}) {
  const palette = accent ? SECTION_ACCENTS[accent] : null;
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {palette ? <div className={`h-1.5 bg-gradient-to-r ${palette.bar}`} /> : null}
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3",
          palette && `bg-gradient-to-r ${palette.wash}`
        )}
      >
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

const TAG_TONES: Record<string, string> = {
  hot_lead: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-200",
  "hot lead": "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-200",
  customer: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-200",
  vip: "bg-gold/15 text-gold ring-gold/30",
  prospect: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-200",
  whatsapp: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-200",
  email: "bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:text-amber-200",
  voice: "bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:text-violet-200",
  sms: "bg-cyan-500/12 text-cyan-700 ring-cyan-500/25 dark:text-cyan-200",
  positive: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-200",
  negative: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-200",
  mixed: "bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:text-amber-200",
};

export function CrmTag({ children }: { children: ReactNode }) {
  const key = String(children).trim().toLowerCase().replace(/\s+/g, "_");
  const tone =
    TAG_TONES[key] ??
    TAG_TONES[String(children).trim().toLowerCase()] ??
    "bg-surface-muted text-muted ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ring-1",
        tone
      )}
    >
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

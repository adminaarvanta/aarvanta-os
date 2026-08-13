"use client";

import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";
import { usePlan } from "@/components/billing/plan-context";
import { cn } from "@/lib/utils";

export function PremiumBadge({
  className,
  title = "Premium — upgrade to unlock",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-bright ring-1 ring-gold/30",
        className
      )}
    >
      <Lock className="h-3 w-3" aria-hidden />
      Pro
    </span>
  );
}

export function UpgradeBanner({
  title,
  message,
  href = "/billing",
  className,
  variant = "default",
  ctaLabel = "View plans",
}: {
  title: string;
  message: string;
  href?: string;
  className?: string;
  variant?: "default" | "warning" | "explore";
  ctaLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
        variant === "warning" && "border-amber-500/40 bg-amber-500/10",
        variant === "explore" && "border-gold/40 bg-gold/10",
        variant === "default" && "border-border bg-surface-elevated",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
          {variant === "explore" ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Crown className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted">{message}</p>
        </div>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-gold-bright"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | "unlimited" | null | undefined;
}) {
  if (limit === "unlimited" || limit == null) return null;
  const pct = limit <= 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="min-w-[7.5rem] flex-1">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
        <span className="font-medium text-muted">{label}</span>
        <span className="text-dim">
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 90 ? "bg-amber-500" : "bg-gold"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function PlanUsageStrip({ upgradeHref = "/billing" }: { upgradeHref?: string }) {
  const plan = usePlan();
  if (!plan || plan.isSuperAdmin || plan.planId !== "free") return null;

  const creditsLimit =
    typeof plan.limits.aiCredits === "number" ? plan.limits.aiCredits : null;
  const creditsUsed = plan.usage.ai_credits ?? 0;
  const seatsLimit = typeof plan.limits.users === "number" ? plan.limits.users : null;
  const buildLimit =
    typeof plan.limits.buildDrafts === "number" ? plan.limits.buildDrafts : null;
  const buildUsed = plan.buildDraftsUsed ?? 0;

  return (
    <div className="mt-3 flex flex-wrap items-end gap-4 border-t border-border/60 pt-3">
      <UsageMeter label="AI credits" used={creditsUsed} limit={creditsLimit} />
      <UsageMeter label="Seats" used={Math.max(1, plan.usage.seats ?? 1)} limit={seatsLimit} />
      {buildLimit != null ? (
        <UsageMeter label="Website drafts" used={buildUsed} limit={buildLimit} />
      ) : null}
      <Link
        href={upgradeHref}
        className="ml-auto text-[11px] font-semibold text-gold hover:underline"
      >
        Upgrade for more →
      </Link>
    </div>
  );
}

export function FeatureGate({
  locked,
  explore,
  featureLabel,
  planName,
  children,
}: {
  locked: boolean;
  explore?: boolean;
  featureLabel?: string;
  planName?: string;
  children: React.ReactNode;
}) {
  const plan = usePlan();
  const upgradeHref = `/billing?upgrade=${encodeURIComponent(
    (featureLabel ?? "plan").toLowerCase().replace(/\s+/g, "-")
  )}`;

  if (locked) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <UpgradeBanner
          title={`${featureLabel ?? "This feature"} is not on your plan`}
          message={`Upgrade from ${planName ?? "Free"} to unlock this part of Aarvanta OS.`}
          href={upgradeHref}
          ctaLabel="Upgrade"
        />
        <div className="pointer-events-none select-none opacity-40 blur-[1px]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {explore ? (
        <div className="shrink-0 border-b border-border-subtle px-4 py-3">
          <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {plan?.planName ?? "Free"} · Explore {featureLabel ?? "this area"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Browse freely. Upgrade to create live records, send messages, and run
                    production AI actions.
                  </p>
                </div>
              </div>
              <Link
                href={upgradeHref}
                className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-gold-bright"
              >
                Upgrade
              </Link>
            </div>
            <PlanUsageStrip upgradeHref={upgradeHref} />
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

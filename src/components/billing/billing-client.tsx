"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingPlan, Subscription } from "@/types/platform-modules";
import type { EntitlementsClient } from "@/lib/billing/entitlements";
import type { PlanLimits, PublicPlanId } from "@/lib/billing/plan-catalog";

type MeterRow = {
  key: string;
  label: string;
  used: number;
  limit: number | "unlimited";
  remaining: number | "unlimited";
  percent: number | null;
};

type CatalogCard = {
  id: PublicPlanId;
  name: string;
  tagline: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  highlighted?: boolean;
  highlights: string[];
  exclusions?: string[];
  limits: PlanLimits;
};

function formatLimit(value: number | "unlimited"): string {
  return value === "unlimited" ? "Unlimited" : value.toLocaleString();
}

function UsageBar({ percent }: { percent: number | null }) {
  if (percent === null) {
    return (
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full w-1/12 rounded-full bg-gold/40" />
      </div>
    );
  }
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-gold"
        )}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

export function BillingClient({
  plans,
  catalog,
  subscriptions,
  entitlements,
  meters,
  period,
  stripeConfigured,
}: {
  plans: BillingPlan[];
  catalog: CatalogCard[];
  subscriptions: Subscription[];
  entitlements: EntitlementsClient;
  meters: MeterRow[];
  period: string;
  stripeConfigured: boolean;
}) {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function startCheckout(planId: string) {
    if (planId === "free" || planId === "enterprise") {
      if (planId === "enterprise") {
        window.location.href = "/contact";
        return;
      }
      return;
    }
    setBusyPlan(planId);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await res.json()) as {
        url?: string;
        demo?: boolean;
        message?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "Checkout failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setInfo(data.message ?? "Plan activated.");
      router.refresh();
    } finally {
      setBusyPlan(null);
    }
  }

  async function openPortal() {
    setError(null);
    setInfo(null);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = (await res.json()) as {
      url?: string;
      demo?: boolean;
      message?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      setError(data.error?.message ?? "Could not open portal");
      return;
    }
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setInfo(data.message ?? "Portal unavailable in demo.");
  }

  const paidPlans = catalog.filter((p) => p.id !== "free");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-foreground">
            Current plan:{" "}
            <span className="font-semibold text-gold-bright">
              {entitlements.isSuperAdmin
                ? "Super Admin (full access)"
                : entitlements.planName}
            </span>
            {!entitlements.isSuperAdmin ? (
              <span className="text-muted"> · period {period}</span>
            ) : (
              <span className="text-muted"> · plan gates bypassed</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            Payments via Stripe ·{" "}
            {stripeConfigured ? (
              <span className="text-foreground">Live keys detected</span>
            ) : (
              <span className="text-dim">Demo mode (local plan activation)</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/referrals"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground hover:border-gold/40"
          >
            Start referrals
          </Link>
          <Button type="button" variant="secondary" onClick={() => void openPortal()}>
            Manage billing
          </Button>
        </div>
      </div>

      {(error || info) && (
        <p className={`text-xs ${error ? "text-red-400" : "text-muted"}`}>
          {error ?? info}
        </p>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Usage this month
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {meters.map((meter) => (
            <div
              key={meter.key}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wide text-dim">
                  {meter.label}
                </p>
                <p className="text-xs text-muted">
                  {meter.used.toLocaleString()} / {formatLimit(meter.limit)}
                </p>
              </div>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {meter.remaining === "unlimited"
                  ? "∞"
                  : meter.remaining.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-muted">
                  remaining
                </span>
              </p>
              <div className="mt-3">
                <UsageBar percent={meter.percent} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Plans</h3>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {catalog.map((plan) => {
            const isCurrent = plan.id === entitlements.planId;
            const price =
              plan.priceMonthly === null
                ? "Custom"
                : plan.priceMonthly === 0
                  ? "£0"
                  : `£${plan.priceMonthly}`;
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-xl border p-4",
                  plan.highlighted
                    ? "border-gold/50 bg-surface-elevated ring-1 ring-gold/30"
                    : "border-border bg-surface-elevated",
                  isCurrent && "ring-1 ring-gold"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                  {isCurrent ? (
                    <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gold-bright">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted">{plan.tagline}</p>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {price}
                  {typeof plan.priceMonthly === "number" && plan.priceMonthly > 0 ? (
                    <span className="text-sm font-normal text-muted">/mo</span>
                  ) : null}
                </p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {plan.highlights.slice(0, 5).map((line) => (
                    <li key={line} className="text-xs text-muted">
                      · {line}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {plan.id === "free" ? (
                    <Button type="button" variant="secondary" disabled={isCurrent}>
                      {isCurrent ? "Your plan" : "Included"}
                    </Button>
                  ) : plan.id === "enterprise" ? (
                    <Link
                      href="/contact"
                      className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-gold/40"
                    >
                      Contact sales
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => void startCheckout(plan.id)}
                      disabled={busyPlan === plan.id || isCurrent}
                    >
                      {busyPlan === plan.id
                        ? "Working…"
                        : isCurrent
                          ? "Current plan"
                          : stripeConfigured
                            ? "Subscribe"
                            : "Activate (demo)"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-dim">
          Annual billing saves 2 months on paid plans. Stripe catalog has{" "}
          {plans.length} paid SKUs; Free is the default with no subscription row.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Subscription history
        </h3>
        <ul className="space-y-2">
          {subscriptions.length === 0 ? (
            <li className="rounded-lg border border-border bg-surface-muted p-3 text-xs text-muted">
              No paid subscriptions yet — you are on Free.
            </li>
          ) : (
            subscriptions.map((subscription) => (
              <li
                key={subscription.id}
                className="rounded-lg border border-border bg-surface-muted p-3"
              >
                <p className="text-sm text-foreground">
                  {paidPlans.find((p) => p.id === subscription.planId)?.name ??
                    subscription.planId}{" "}
                  · {subscription.status}
                </p>
                <p className="mt-1 text-[11px] text-dim">
                  Period ends{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  {subscription.stripeSubscriptionId
                    ? ` · ${subscription.stripeSubscriptionId}`
                    : null}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

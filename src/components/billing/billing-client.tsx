"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BillingPlan, Subscription, UsageRecord } from "@/types/platform-modules";

export function BillingClient({
  plans,
  subscriptions,
  usage,
  stripeConfigured,
}: {
  plans: BillingPlan[];
  subscriptions: Subscription[];
  usage: UsageRecord[];
  stripeConfigured: boolean;
}) {
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function startCheckout(planId: string) {
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
      setInfo(data.message ?? "Demo checkout recorded.");
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

  const totalSeats = usage
    .filter((record) => record.metric === "seats")
    .reduce((sum, record) => sum + record.quantity, 0);
  const totalAgentRuns = usage
    .filter((record) => record.metric === "agent_runs")
    .reduce((sum, record) => sum + record.quantity, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">
            Payments via Stripe ·{" "}
            {stripeConfigured ? (
              <span className="text-foreground">Live keys detected</span>
            ) : (
              <span className="text-dim">Not configured (demo fallback)</span>
            )}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void openPortal()}>
          Manage billing
        </Button>
      </div>

      {(error || info) && (
        <p className={`text-xs ${error ? "text-red-400" : "text-muted"}`}>
          {error ?? info}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Plans", value: String(plans.length), sub: "Starter to enterprise" },
          {
            label: "Subscriptions",
            value: String(subscriptions.length),
            sub: "Active tenant subscriptions",
          },
          { label: "Seats", value: String(totalSeats), sub: "Current metered seats" },
          {
            label: "Agent runs",
            value: totalAgentRuns.toLocaleString(),
            sub: "Latest usage periods",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface-elevated p-4"
          >
            <p className="text-[11px] uppercase tracking-wide text-dim">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.sub}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Plans</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-elevated p-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {plan.name}{" "}
                  <span className="text-gold">
                    {plan.currency} {plan.priceMonthly}/mo
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted">{plan.features.join(" · ")}</p>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={() => void startCheckout(plan.id)}
                  disabled={busyPlan === plan.id}
                >
                  {busyPlan === plan.id ? "Redirecting…" : "Subscribe with Stripe"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Subscriptions</h3>
        <ul className="space-y-2">
          {subscriptions.length === 0 ? (
            <li className="rounded-lg border border-border bg-surface-muted p-3 text-xs text-muted">
              No subscriptions yet.
            </li>
          ) : (
            subscriptions.map((subscription) => (
              <li
                key={subscription.id}
                className="rounded-lg border border-border bg-surface-muted p-3"
              >
                <p className="text-sm text-foreground">
                  {subscription.planId} · {subscription.status}
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

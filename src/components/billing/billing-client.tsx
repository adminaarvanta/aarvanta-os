"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingPlan, Subscription } from "@/types/platform-modules";
import type { EntitlementsClient } from "@/lib/billing/entitlements";
import type { PlanLimits, PublicPlanId } from "@/lib/billing/plan-catalog";
import type { BillingInvoiceView, StripePaymentRecord } from "@/types/stripe-billing";

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

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
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
  stripeMode,
  canManageBilling,
  invoices,
  payments,
  checkoutResult,
  checkoutSessionId,
  pastDue,
}: {
  plans: BillingPlan[];
  catalog: CatalogCard[];
  subscriptions: Subscription[];
  entitlements: EntitlementsClient;
  meters: MeterRow[];
  period: string;
  stripeConfigured: boolean;
  stripeMode: "test" | "live" | null;
  canManageBilling: boolean;
  invoices: BillingInvoiceView[];
  payments: StripePaymentRecord[];
  checkoutResult?: "success" | "canceled" | null;
  checkoutSessionId?: string | null;
  pastDue?: boolean;
}) {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (checkoutResult === "canceled") {
      setInfo("Checkout was canceled. No charge was made.");
    }
  }, [checkoutResult]);

  useEffect(() => {
    if (checkoutResult !== "success" || !checkoutSessionId || syncedRef.current) return;
    if (!canManageBilling || !stripeConfigured) {
      setInfo("Payment received. Refreshing your plan…");
      router.refresh();
      return;
    }
    syncedRef.current = true;
    setInfo("Confirming payment with Stripe…");
    void (async () => {
      try {
        const res = await fetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: checkoutSessionId }),
        });
        const data = (await res.json()) as {
          status?: string;
          error?: { message?: string };
        };
        if (!res.ok) {
          setError(data.error?.message ?? "Could not confirm payment yet. Webhook will retry.");
          return;
        }
        if (data.status === "paid") {
          setInfo("Payment confirmed. Your plan is active.");
        } else if (data.status === "pending") {
          setInfo("Payment is still processing. This page will update when Stripe confirms.");
        } else {
          setInfo("Checkout did not complete.");
        }
        router.refresh();
      } catch {
        setError("Could not confirm payment yet. If the charge succeeded, wait a few seconds and refresh.");
      }
    })();
  }, [canManageBilling, checkoutResult, checkoutSessionId, router, stripeConfigured]);

  async function startCheckout(planId: string) {
    if (planId === "free" || planId === "enterprise") {
      if (planId === "enterprise") {
        router.push("/contact");
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
        window.location.assign(data.url);
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
      window.location.assign(data.url);
      return;
    }
    setInfo(data.message ?? "Portal unavailable in demo.");
  }

  const paidPlans = catalog.filter((p) => p.id !== "free");

  return (
    <div className="space-y-8">
      {pastDue ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Payment failed. Update your card in Manage billing to keep this plan.
        </div>
      ) : null}

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
          {!entitlements.isSuperAdmin &&
          (entitlements.creditOverrides.unlimitedVoice ||
            entitlements.creditOverrides.unlimitedEmailOutreach) ? (
            <p className="mt-1 text-xs text-gold-bright">
              Super-admin grants:
              {entitlements.creditOverrides.unlimitedVoice ? " unlimited voice" : ""}
              {entitlements.creditOverrides.unlimitedVoice &&
              entitlements.creditOverrides.unlimitedEmailOutreach
                ? ","
                : ""}
              {entitlements.creditOverrides.unlimitedEmailOutreach
                ? " unlimited email outreach"
                : ""}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            Payments via Stripe ·{" "}
            {stripeConfigured ? (
              <span className="text-foreground">
                {stripeMode === "live" ? "Live" : "Test"} mode
              </span>
            ) : (
              <span className="text-dim">Demo mode (local plan activation)</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/partners"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground hover:border-gold/40"
          >
            Partners
          </Link>
          {canManageBilling ? (
            <Button type="button" variant="secondary" onClick={() => void openPortal()}>
              Manage billing
            </Button>
          ) : null}
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
                      Contact us
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => void startCheckout(plan.id)}
                      disabled={
                        busyPlan === plan.id ||
                        isCurrent ||
                        !canManageBilling
                      }
                    >
                      {busyPlan === plan.id
                        ? "Working…"
                        : isCurrent
                          ? "Current plan"
                          : !canManageBilling
                            ? "Owner/admin only"
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
          {stripeConfigured
            ? " Card, wallets, and invoices run through Stripe Checkout and the Customer Portal."
            : " Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to take live payments."}
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Invoices</h3>
        <ul className="space-y-2">
          {invoices.length === 0 ? (
            <li className="rounded-lg border border-border bg-surface-muted p-3 text-xs text-muted">
              {stripeConfigured
                ? "No Stripe invoices yet."
                : "Invoices appear here after Stripe is connected."}
            </li>
          ) : (
            invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted p-3"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {invoice.number ?? invoice.id} · {invoice.status}
                  </p>
                  <p className="mt-1 text-[11px] text-dim">
                    {formatMoney(
                      invoice.paid ? invoice.amountPaid : invoice.amountDue,
                      invoice.currency
                    )}{" "}
                    · {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {invoice.hostedInvoiceUrl ? (
                  <a
                    href={invoice.hostedInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-gold hover:underline"
                  >
                    View invoice
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
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

      {payments.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Recent checkout
          </h3>
          <ul className="space-y-2">
            {payments.slice(0, 8).map((payment) => (
              <li
                key={payment.id}
                className="rounded-lg border border-border bg-surface-muted p-3 text-xs text-muted"
              >
                {payment.description} · {payment.status} ·{" "}
                {formatMoney(payment.amount, payment.currency)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

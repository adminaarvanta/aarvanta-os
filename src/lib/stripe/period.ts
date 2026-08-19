import type Stripe from "stripe";

/** Basil API stores period on subscription items, not the subscription itself. */
export function subscriptionPeriodEndUnix(subscription: Stripe.Subscription): number {
  const itemEnd = subscription.items?.data
    ?.map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a)[0];
  if (itemEnd) return itemEnd;

  const legacy = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  if (typeof legacy === "number") return legacy;

  return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
}

export function subscriptionPeriodEndIso(subscription: Stripe.Subscription): string {
  return new Date(subscriptionPeriodEndUnix(subscription) * 1000).toISOString();
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): "active" | "trialing" | "past_due" | "canceled" {
  const map: Record<string, "active" | "trialing" | "past_due" | "canceled"> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "canceled",
    paused: "canceled",
  };
  return map[status] ?? "active";
}

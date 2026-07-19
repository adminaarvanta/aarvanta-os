export type StripeRuntimeStatus =
  | { status: "live"; mode: "test" | "live" }
  | { status: "disabled"; reason: string };

export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || undefined;
}

export function getStripePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    undefined
  );
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getStripeRuntimeStatus(): StripeRuntimeStatus {
  const key = getStripeSecretKey();
  if (!key) {
    return {
      status: "disabled",
      reason: "STRIPE_SECRET_KEY is not set",
    };
  }
  return {
    status: "live",
    mode: key.startsWith("sk_live") ? "live" : "test",
  };
}

export function isStripeConfigured(): boolean {
  return getStripeRuntimeStatus().status === "live";
}

/** Optional Price IDs from Stripe Dashboard — when unset we use ad-hoc `price_data`. */
export function stripePriceEnv(planKey: string): string | undefined {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    scale: process.env.STRIPE_PRICE_SCALE,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    hosting_starter: process.env.STRIPE_PRICE_HOSTING_STARTER,
    hosting_standard: process.env.STRIPE_PRICE_HOSTING_STANDARD,
    hosting_growth: process.env.STRIPE_PRICE_HOSTING_GROWTH,
  };
  return map[planKey]?.trim() || undefined;
}

import type { BillingPlanId } from "@/types/platform-modules";
import { BILLING_PLANS } from "@/lib/data/platform-demo-seed";
import { stripePriceEnv } from "@/lib/stripe/config";
import type { HostingPlanId } from "@/lib/stripe/hosting-plans";

export type { HostingPlan, HostingPlanId } from "@/lib/stripe/hosting-plans";
export {
  HOSTING_PLANS,
  getHostingPlan,
  hostingPlanForInstance,
} from "@/lib/stripe/hosting-plans";

export function getSaasPlan(planId: BillingPlanId) {
  return BILLING_PLANS.find((p) => p.id === planId);
}

export function currencyToStripe(currency: string): string {
  return currency.toLowerCase();
}

/** Amount in the smallest currency unit (pence / cents). */
export function toStripeUnitAmount(amount: number): number {
  return Math.round(amount * 100);
}

export function saasPriceId(planId: BillingPlanId): string | undefined {
  return stripePriceEnv(planId);
}

export function hostingPriceId(planId: HostingPlanId): string | undefined {
  return stripePriceEnv(planId);
}

import type { BillingPlanId } from "@/types/platform-modules";
import type { AwsEc2InstanceType } from "@/types/site-builder";
import { BILLING_PLANS } from "@/lib/data/platform-demo-seed";
import { stripePriceEnv } from "@/lib/stripe/config";

export type HostingPlanId = "hosting_starter" | "hosting_standard" | "hosting_growth";

export type HostingPlan = {
  id: HostingPlanId;
  name: string;
  instanceType: AwsEc2InstanceType;
  priceMonthly: number;
  currency: "GBP" | "USD";
  note: string;
};

export const HOSTING_PLANS: HostingPlan[] = [
  {
    id: "hosting_starter",
    name: "Hosting Starter",
    instanceType: "t3.micro",
    priceMonthly: 12,
    currency: "GBP",
    note: "Light traffic sites",
  },
  {
    id: "hosting_standard",
    name: "Hosting Standard",
    instanceType: "t3.small",
    priceMonthly: 24,
    currency: "GBP",
    note: "Most business sites",
  },
  {
    id: "hosting_growth",
    name: "Hosting Growth",
    instanceType: "t3.medium",
    priceMonthly: 48,
    currency: "GBP",
    note: "Stores & higher traffic",
  },
];

export function getSaasPlan(planId: BillingPlanId) {
  return BILLING_PLANS.find((p) => p.id === planId);
}

export function getHostingPlan(planId: HostingPlanId) {
  return HOSTING_PLANS.find((p) => p.id === planId);
}

export function hostingPlanForInstance(instanceType: AwsEc2InstanceType): HostingPlan {
  return (
    HOSTING_PLANS.find((p) => p.instanceType === instanceType) ?? HOSTING_PLANS[1]!
  );
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

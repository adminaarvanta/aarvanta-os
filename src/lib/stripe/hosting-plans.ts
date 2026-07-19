import type { AwsEc2InstanceType } from "@/types/site-builder";

/** Client-safe hosting catalog (no Firebase / Stripe SDK imports). */

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

export function getHostingPlan(planId: HostingPlanId) {
  return HOSTING_PLANS.find((p) => p.id === planId);
}

export function hostingPlanForInstance(instanceType: AwsEc2InstanceType): HostingPlan {
  return (
    HOSTING_PLANS.find((p) => p.instanceType === instanceType) ?? HOSTING_PLANS[1]!
  );
}

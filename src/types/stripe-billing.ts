import type { TenantScope } from "@/types/communication";
import type { BillingPlanId } from "@/types/platform-modules";
import type { HostingPlanId } from "@/lib/stripe/catalog";

export type StripeCheckoutKind = "saas_plan" | "domain" | "hosting";

export type StripeCheckoutRequest =
  | {
      kind: "saas_plan";
      planId: BillingPlanId;
    }
  | {
      kind: "domain";
      domain: string;
      tld: string;
      priceAnnual: number;
      currency: "GBP" | "USD";
      autoRenew: boolean;
      buildJobId?: string;
      orderId?: string;
    }
  | {
      kind: "hosting";
      hostingPlanId: HostingPlanId;
      buildJobId?: string;
      domain?: string;
    };

export type ProcessedWebhookEvent = TenantScope & {
  id: string;
  stripeEventId: string;
  type: string;
  processedAt: string;
};

export type StripePaymentRecord = TenantScope & {
  id: string;
  kind: StripeCheckoutKind;
  status: "pending" | "paid" | "failed" | "canceled";
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  amount: number;
  currency: string;
  description: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
};

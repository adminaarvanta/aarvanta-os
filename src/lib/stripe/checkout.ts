import type Stripe from "stripe";
import { BILLING_PLANS } from "@/lib/data/platform-demo-seed";
import { findOrCreateStripeCustomer } from "@/lib/stripe/customer";
import {
  currencyToStripe,
  getHostingPlan,
  getSaasPlan,
  hostingPriceId,
  saasPriceId,
  toStripeUnitAmount,
  type HostingPlanId,
} from "@/lib/stripe/catalog";
import { getAppBaseUrl } from "@/lib/stripe/config";
import { requireStripe } from "@/lib/stripe/client";
import type { StripeCheckoutKind, StripeCheckoutRequest } from "@/types/stripe-billing";
import type { TenantScope } from "@/types/communication";
import type { BillingPlanId } from "@/types/platform-modules";

function scopeMeta(scope: TenantScope): Record<string, string> {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    companyId: scope.companyId,
  };
}

function successUrl(kind: StripeCheckoutKind): string {
  const base = getAppBaseUrl();
  if (kind === "saas_plan") {
    return `${base}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  }
  return `${base}/build?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
}

function cancelUrl(kind: StripeCheckoutKind): string {
  const base = getAppBaseUrl();
  if (kind === "saas_plan") return `${base}/billing?checkout=canceled`;
  return `${base}/build?checkout=canceled`;
}

function checkoutBaseParams(input: {
  kind: StripeCheckoutKind;
  customer: string;
  metadata: Record<string, string>;
  discounts?: Stripe.Checkout.SessionCreateParams.Discount[];
}): Pick<
  Stripe.Checkout.SessionCreateParams,
  | "customer"
  | "success_url"
  | "cancel_url"
  | "billing_address_collection"
  | "customer_update"
  | "allow_promotion_codes"
  | "locale"
  | "metadata"
> {
  const discounts = input.discounts ?? [];
  return {
    customer: input.customer,
    success_url: successUrl(input.kind),
    cancel_url: cancelUrl(input.kind),
    billing_address_collection: "auto",
    customer_update: { address: "auto", name: "auto" },
    allow_promotion_codes: discounts.length === 0,
    locale: "auto",
    metadata: input.metadata,
  };
}

export async function createSaasCheckoutSession(input: {
  scope: TenantScope;
  planId: BillingPlanId;
  email?: string;
  name?: string;
  stripeCustomerId?: string;
  /** Affiliate discount percent (0–100) applied as Stripe coupon. */
  discountPercent?: number;
  affiliateId?: string;
  referralCode?: string;
}): Promise<Stripe.Checkout.Session> {
  const plan = getSaasPlan(input.planId);
  if (!plan) throw new Error(`Unknown plan: ${input.planId}`);
  if (plan.priceMonthly <= 0) {
    throw new Error("Enterprise and custom plans are not billed through Checkout.");
  }

  const stripe = requireStripe();
  const customer = await findOrCreateStripeCustomer(input);
  const priceId = saasPriceId(input.planId);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: currencyToStripe(plan.currency),
            unit_amount: toStripeUnitAmount(plan.priceMonthly),
            recurring: { interval: "month" },
            product_data: {
              name: `Aarvanta OS — ${plan.name}`,
              description: plan.features.join(" · ").slice(0, 500),
            },
          },
        },
      ];

  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (input.discountPercent && input.discountPercent > 0) {
    const coupon = await stripe.coupons.create({
      percent_off: Math.min(100, Math.round(input.discountPercent)),
      duration: "once",
      name: `Affiliate ${input.referralCode ?? "partner"}`,
      metadata: {
        affiliateId: input.affiliateId ?? "",
        referralCode: input.referralCode ?? "",
      },
    });
    discounts.push({ coupon: coupon.id });
  }

  const affiliateMeta = {
    ...(input.affiliateId ? { affiliateId: input.affiliateId } : {}),
    ...(input.referralCode ? { referralCode: input.referralCode } : {}),
    ...(input.discountPercent
      ? { discountPercent: String(input.discountPercent) }
      : {}),
  };

  const metadata = {
    ...scopeMeta(input.scope),
    kind: "saas_plan" as const,
    planId: input.planId,
    ...affiliateMeta,
  };

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: lineItems,
    ...(discounts.length ? { discounts } : {}),
    ...checkoutBaseParams({
      kind: "saas_plan",
      customer,
      metadata,
      discounts,
    }),
    client_reference_id: input.scope.tenantId,
    payment_method_collection: "always",
    subscription_data: {
      metadata,
    },
  });
}

export async function createDomainCheckoutSession(input: {
  scope: TenantScope;
  domain: string;
  tld: string;
  priceAnnual: number;
  currency: "GBP" | "USD";
  autoRenew: boolean;
  orderId: string;
  buildJobId?: string;
  email?: string;
  name?: string;
  stripeCustomerId?: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = requireStripe();
  const customer = await findOrCreateStripeCustomer(input);
  const metadata = {
    ...scopeMeta(input.scope),
    kind: "domain",
    domain: input.domain,
    tld: input.tld,
    orderId: input.orderId,
    autoRenew: String(input.autoRenew),
    buildJobId: input.buildJobId ?? "",
    priceAnnual: String(input.priceAnnual),
    currency: input.currency,
  };

  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currencyToStripe(input.currency),
          unit_amount: toStripeUnitAmount(input.priceAnnual),
          product_data: {
            name: `Domain: ${input.domain}`,
            description: `1-year registration${input.autoRenew ? " (auto-renew enabled in Aarvanta)" : ""}`,
          },
        },
      },
    ],
    ...checkoutBaseParams({ kind: "domain", customer, metadata }),
    client_reference_id: input.orderId,
    invoice_creation: { enabled: true },
    payment_intent_data: {
      metadata,
      ...(input.email ? { receipt_email: input.email } : {}),
    },
    submit_type: "pay",
  });
}

export async function createHostingCheckoutSession(input: {
  scope: TenantScope;
  hostingPlanId: HostingPlanId;
  buildJobId?: string;
  domain?: string;
  email?: string;
  name?: string;
  stripeCustomerId?: string;
}): Promise<Stripe.Checkout.Session> {
  const plan = getHostingPlan(input.hostingPlanId);
  if (!plan) throw new Error(`Unknown hosting plan: ${input.hostingPlanId}`);

  const stripe = requireStripe();
  const customer = await findOrCreateStripeCustomer(input);
  const priceId = hostingPriceId(input.hostingPlanId);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: currencyToStripe(plan.currency),
            unit_amount: toStripeUnitAmount(plan.priceMonthly),
            recurring: { interval: "month" },
            product_data: {
              name: `Aarvanta Hosting — ${plan.name}`,
              description: `${plan.instanceType} · ${plan.note}`,
            },
          },
        },
      ];

  const metadata = {
    ...scopeMeta(input.scope),
    kind: "hosting",
    hostingPlanId: input.hostingPlanId,
    instanceType: plan.instanceType,
    buildJobId: input.buildJobId ?? "",
    domain: input.domain ?? "",
  };

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: lineItems,
    ...checkoutBaseParams({ kind: "hosting", customer, metadata }),
    client_reference_id: input.buildJobId ?? input.scope.tenantId,
    payment_method_collection: "always",
    subscription_data: {
      metadata,
    },
  });
}

export async function createCheckoutSession(
  request: StripeCheckoutRequest,
  ctx: {
    scope: TenantScope;
    email?: string;
    name?: string;
    stripeCustomerId?: string;
    orderId?: string;
  }
): Promise<Stripe.Checkout.Session> {
  if (request.kind === "saas_plan") {
    return createSaasCheckoutSession({
      scope: ctx.scope,
      planId: request.planId,
      email: ctx.email,
      name: ctx.name,
      stripeCustomerId: ctx.stripeCustomerId,
    });
  }
  if (request.kind === "domain") {
    if (!ctx.orderId && !request.orderId) {
      throw new Error("Domain checkout requires an orderId");
    }
    return createDomainCheckoutSession({
      scope: ctx.scope,
      domain: request.domain,
      tld: request.tld,
      priceAnnual: request.priceAnnual,
      currency: request.currency,
      autoRenew: request.autoRenew,
      orderId: ctx.orderId ?? request.orderId!,
      buildJobId: request.buildJobId,
      email: ctx.email,
      name: ctx.name,
      stripeCustomerId: ctx.stripeCustomerId,
    });
  }
  return createHostingCheckoutSession({
    scope: ctx.scope,
    hostingPlanId: request.hostingPlanId,
    buildJobId: request.buildJobId,
    domain: request.domain,
    email: ctx.email,
    name: ctx.name,
    stripeCustomerId: ctx.stripeCustomerId,
  });
}

export async function createBillingPortalSession(input: {
  stripeCustomerId: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = requireStripe();
  const returnUrl = `${getAppBaseUrl()}/billing`;
  try {
    return await stripe.billingPortal.sessions.create({
      customer: input.stripeCustomerId,
      return_url: returnUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/configuration/i.test(message) && !/no configuration/i.test(message)) {
      throw error;
    }
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Aarvanta OS billing",
      },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "address", "name", "phone"],
        },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
        },
      },
    });
    return stripe.billingPortal.sessions.create({
      customer: input.stripeCustomerId,
      return_url: returnUrl,
      configuration: configuration.id,
    });
  }
}

export function listPublicSaasPlans() {
  return BILLING_PLANS;
}

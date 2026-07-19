import type Stripe from "stripe";
import { BILLING_PLANS } from "@/lib/data/platform-demo-seed";
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
  if (kind === "saas_plan") return `${base}/billing?checkout=success`;
  return `${base}/build?checkout=success`;
}

function cancelUrl(kind: StripeCheckoutKind): string {
  const base = getAppBaseUrl();
  if (kind === "saas_plan") return `${base}/billing?checkout=canceled`;
  return `${base}/build?checkout=canceled`;
}

async function findOrCreateCustomer(input: {
  email?: string;
  name?: string;
  scope: TenantScope;
  existingCustomerId?: string;
}): Promise<string> {
  const stripe = requireStripe();
  if (input.existingCustomerId) return input.existingCustomerId;

  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: scopeMeta(input.scope),
  });
  return customer.id;
}

export async function createSaasCheckoutSession(input: {
  scope: TenantScope;
  planId: BillingPlanId;
  email?: string;
  name?: string;
  stripeCustomerId?: string;
}): Promise<Stripe.Checkout.Session> {
  const plan = getSaasPlan(input.planId);
  if (!plan) throw new Error(`Unknown plan: ${input.planId}`);

  const stripe = requireStripe();
  const customer = await findOrCreateCustomer(input);
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
              description: plan.features.join(" · "),
            },
          },
        },
      ];

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: lineItems,
    success_url: successUrl("saas_plan"),
    cancel_url: cancelUrl("saas_plan"),
    client_reference_id: input.scope.tenantId,
    metadata: {
      ...scopeMeta(input.scope),
      kind: "saas_plan",
      planId: input.planId,
    },
    subscription_data: {
      metadata: {
        ...scopeMeta(input.scope),
        kind: "saas_plan",
        planId: input.planId,
      },
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
  const customer = await findOrCreateCustomer(input);

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer,
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
    success_url: successUrl("domain"),
    cancel_url: cancelUrl("domain"),
    client_reference_id: input.orderId,
    metadata: {
      ...scopeMeta(input.scope),
      kind: "domain",
      domain: input.domain,
      tld: input.tld,
      orderId: input.orderId,
      autoRenew: String(input.autoRenew),
      buildJobId: input.buildJobId ?? "",
      priceAnnual: String(input.priceAnnual),
      currency: input.currency,
    },
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
  const customer = await findOrCreateCustomer(input);
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

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: lineItems,
    success_url: successUrl("hosting"),
    cancel_url: cancelUrl("hosting"),
    client_reference_id: input.buildJobId ?? input.scope.tenantId,
    metadata: {
      ...scopeMeta(input.scope),
      kind: "hosting",
      hostingPlanId: input.hostingPlanId,
      instanceType: plan.instanceType,
      buildJobId: input.buildJobId ?? "",
      domain: input.domain ?? "",
    },
    subscription_data: {
      metadata: {
        ...scopeMeta(input.scope),
        kind: "hosting",
        hostingPlanId: input.hostingPlanId,
        instanceType: plan.instanceType,
        buildJobId: input.buildJobId ?? "",
      },
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
  return stripe.billingPortal.sessions.create({
    customer: input.stripeCustomerId,
    return_url: `${getAppBaseUrl()}/billing`,
  });
}

export function listPublicSaasPlans() {
  return BILLING_PLANS;
}

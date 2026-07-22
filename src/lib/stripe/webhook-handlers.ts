import type Stripe from "stripe";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { getDomainOrderRepository } from "@/lib/data/domain-order-store";
import { getBillingStore } from "@/lib/data/platform-store";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getStripePaymentStore } from "@/lib/data/stripe-payment-store";
import {
  getDomainRegistrar,
  isLiveDomainRegistrar,
} from "@/lib/registrars";
import {
  generateRegistrantCredentials,
} from "@/lib/registrars/opensrs-client";
import { getDefaultRegistrantContact } from "@/lib/registrars/opensrs-config";
import { toPurchasedDomainPreference } from "@/lib/site-builder/domain-purchase";
import type { TenantScope } from "@/types/communication";
import type { BillingPlanId } from "@/types/platform-modules";
import type { AwsEc2InstanceType } from "@/types/site-builder";

function scopeFromMetadata(meta: Stripe.Metadata): TenantScope | null {
  const { tenantId, workspaceId, companyId } = meta;
  if (!tenantId || !workspaceId || !companyId) return null;
  return { tenantId, workspaceId, companyId };
}

async function markPaymentPaid(session: Stripe.Checkout.Session, scope: TenantScope) {
  const store = getStripePaymentStore();
  const existing = session.id
    ? await store.findByCheckoutSession(session.id, scope)
    : null;
  const now = crmNow();
  if (existing) {
    await store.save({
      ...existing,
      status: "paid",
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : existing.stripePaymentIntentId,
      stripeSubscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : existing.stripeSubscriptionId,
      stripeCustomerId:
        typeof session.customer === "string"
          ? session.customer
          : existing.stripeCustomerId,
      paidAt: now,
      updatedAt: now,
    });
    return;
  }

  await store.save({
    ...scope,
    id: crmNewId("pay"),
    kind: (session.metadata?.kind as "saas_plan" | "domain" | "hosting") ?? "saas_plan",
    status: "paid",
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    stripeSubscriptionId:
      typeof session.subscription === "string" ? session.subscription : undefined,
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : undefined,
    amount: (session.amount_total ?? 0) / 100,
    currency: (session.currency ?? "gbp").toUpperCase(),
    description: session.metadata?.kind ?? "checkout",
    metadata: Object.fromEntries(
      Object.entries(session.metadata ?? {}).map(([k, v]) => [k, String(v)])
    ),
    createdAt: now,
    updatedAt: now,
    paidAt: now,
  });
}

async function fulfillDomainAtRegistrar(order: {
  domain: string;
  autoRenew: boolean;
  registrarOrderId: string;
}): Promise<string> {
  if (order.registrarOrderId) {
    return order.registrarOrderId;
  }

  if (!isLiveDomainRegistrar()) {
    return `AAR-DOM-${order.domain.replace(/\./g, "").toUpperCase().slice(0, 16)}`;
  }

  const registrar = getDomainRegistrar();
  const { regUsername, regPassword } = generateRegistrantCredentials(order.domain);
  const result = await registrar.registerDomain({
    domain: order.domain,
    years: 1,
    autoRenew: order.autoRenew,
    contact: getDefaultRegistrantContact(),
    regUsername,
    regPassword,
  });
  return result.orderId;
}

async function completeDomainOrder(session: Stripe.Checkout.Session, scope: TenantScope) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const repo = getDomainOrderRepository();
  const order = await repo.get(orderId, scope);
  if (!order) return;

  // Already fulfilled (webhook retry)
  if (order.status === "completed" && order.registrarOrderId) {
    return;
  }

  const autoRenew = session.metadata?.autoRenew === "true" || order.autoRenew;

  let registrarOrderId: string;
  try {
    registrarOrderId = await fulfillDomainAtRegistrar({
      domain: order.domain,
      autoRenew,
      registrarOrderId: order.registrarOrderId,
    });
  } catch (err) {
    console.error("[stripe] OpenSRS domain registration failed after payment", {
      orderId: order.id,
      domain: order.domain,
      err,
    });
    await repo.save({
      ...order,
      status: "failed",
      purchasedAt: crmNow(),
    });
    return;
  }

  const completed = {
    ...order,
    status: "completed" as const,
    registrarOrderId,
    purchasedAt: crmNow(),
  };
  await repo.save(completed);

  const buildJobId = session.metadata?.buildJobId;
  if (!buildJobId) return;

  const jobRepo = getSiteBuildRepository();
  const job = await jobRepo.get(buildJobId, scope);
  if (!job) return;

  const domainPreference = toPurchasedDomainPreference(completed, autoRenew);
  await jobRepo.save({
    ...job,
    preferences: {
      ...job.preferences,
      deployment: {
        ...job.preferences.deployment,
        domain: domainPreference,
      },
    },
    updatedAt: crmNow(),
  });
}

async function upsertSaasSubscription(
  session: Stripe.Checkout.Session,
  scope: TenantScope
) {
  const planId = session.metadata?.planId as BillingPlanId | undefined;
  if (!planId) return;

  const billing = getBillingStore();
  const existing = (await billing.list(scope)).find(
    (s) => s.stripeCustomerId === session.customer || s.planId === planId
  );
  const customerId =
    typeof session.customer === "string" ? session.customer : undefined;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : undefined;
  const now = crmNow();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (existing) {
    await billing.set({
      ...existing,
      planId,
      status: "active",
      stripeCustomerId: customerId ?? existing.stripeCustomerId,
      stripeSubscriptionId: subscriptionId ?? existing.stripeSubscriptionId,
      currentPeriodEnd: periodEnd,
    });
    return;
  }

  await billing.create({
    ...scope,
    planId,
    status: "active",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: periodEnd,
    createdAt: now,
  });
}

async function applyHostingSubscription(
  session: Stripe.Checkout.Session,
  scope: TenantScope
) {
  const buildJobId = session.metadata?.buildJobId;
  const instanceType = session.metadata?.instanceType as AwsEc2InstanceType | undefined;
  if (!buildJobId || !instanceType) return;

  const jobRepo = getSiteBuildRepository();
  const job = await jobRepo.get(buildJobId, scope);
  if (!job) return;

  await jobRepo.save({
    ...job,
    preferences: {
      ...job.preferences,
      deployment: {
        ...job.preferences.deployment,
        ec2: {
          ...job.preferences.deployment.ec2,
          instanceType,
          autoDeployOnApprove: true,
        },
      },
    },
    updatedAt: crmNow(),
  });
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const scope = scopeFromMetadata(session.metadata ?? {});
  if (!scope) {
    console.warn("[stripe] checkout.session.completed missing tenant metadata");
    return;
  }

  await markPaymentPaid(session, scope);
  const kind = session.metadata?.kind;

  if (kind === "domain") {
    await completeDomainOrder(session, scope);
  } else if (kind === "saas_plan") {
    await upsertSaasSubscription(session, scope);
  } else if (kind === "hosting") {
    await applyHostingSubscription(session, scope);
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const scope = scopeFromMetadata(subscription.metadata ?? {});
  if (!scope || subscription.metadata?.kind !== "saas_plan") return;

  const planId = subscription.metadata.planId as BillingPlanId | undefined;
  if (!planId) return;

  const billing = getBillingStore();
  const existing = (await billing.list(scope)).find(
    (s) =>
      s.stripeSubscriptionId === subscription.id ||
      s.stripeCustomerId === subscription.customer
  );

  const statusMap: Record<string, "active" | "trialing" | "past_due" | "canceled"> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "canceled",
    paused: "canceled",
  };

  const status = statusMap[subscription.status] ?? "active";
  const periodEndUnix =
    (subscription as Stripe.Subscription & { current_period_end?: number })
      .current_period_end ??
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const periodEnd = new Date(periodEndUnix * 1000).toISOString();

  if (existing) {
    await billing.set({
      ...existing,
      planId,
      status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : existing.stripeCustomerId,
      currentPeriodEnd: periodEnd,
    });
    return;
  }

  await billing.create({
    ...scope,
    planId,
    status,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : undefined,
    currentPeriodEnd: periodEnd,
    createdAt: crmNow(),
  });
}

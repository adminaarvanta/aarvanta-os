import type Stripe from "stripe";
import { upsertLocalSubscription } from "@/lib/billing/upsert-local-subscription";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { getDomainOrderRepository } from "@/lib/data/domain-order-store";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getStripePaymentStore } from "@/lib/data/stripe-payment-store";
import { postInvoiceToLedger } from "@/lib/finance/ledger";
import {
  getDomainRegistrar,
  isLiveDomainRegistrar,
} from "@/lib/registrars";
import { generateRegistrantCredentials } from "@/lib/registrars/opensrs-client";
import { getDefaultRegistrantContact } from "@/lib/registrars/domain-pricing";
import { toPurchasedDomainPreference } from "@/lib/site-builder/domain-purchase";
import { requireStripe } from "@/lib/stripe/client";
import { invoiceSubscriptionId, stripeObjectId } from "@/lib/stripe/ids";
import {
  mapStripeSubscriptionStatus,
  subscriptionPeriodEndIso,
} from "@/lib/stripe/period";
import type { TenantScope } from "@/types/communication";
import type { BillingPlanId } from "@/types/platform-modules";
import type { AwsEc2InstanceType } from "@/types/site-builder";
import type { BillingInvoiceView, StripeCheckoutKind } from "@/types/stripe-billing";

function scopeFromMetadata(meta: Stripe.Metadata | null | undefined): TenantScope | null {
  if (!meta) return null;
  const { tenantId, workspaceId, companyId } = meta;
  if (!tenantId || !workspaceId || !companyId) return null;
  return { tenantId, workspaceId, companyId };
}

function checkoutPaid(session: Stripe.Checkout.Session): boolean {
  return (
    session.status === "complete" &&
    (session.payment_status === "paid" || session.payment_status === "no_payment_required")
  );
}

async function markPayment(
  session: Stripe.Checkout.Session,
  scope: TenantScope,
  status: "pending" | "paid" | "failed" | "canceled"
) {
  const store = getStripePaymentStore();
  const existing = session.id
    ? await store.findByCheckoutSession(session.id, scope)
    : null;
  const now = crmNow();
  const kind = (session.metadata?.kind as StripeCheckoutKind | undefined) ?? "saas_plan";
  const payload = {
    kind,
    status,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: stripeObjectId(session.payment_intent),
    stripeSubscriptionId: stripeObjectId(session.subscription),
    stripeCustomerId: stripeObjectId(session.customer),
    amount: (session.amount_total ?? 0) / 100,
    currency: (session.currency ?? "gbp").toUpperCase(),
    description: session.metadata?.kind ?? "checkout",
    metadata: Object.fromEntries(
      Object.entries(session.metadata ?? {}).map(([k, v]) => [k, String(v)])
    ),
    updatedAt: now,
    paidAt: status === "paid" ? now : existing?.paidAt,
  };

  if (existing) {
    await store.save({ ...existing, ...payload });
    return;
  }

  await store.save({
    ...scope,
    id: crmNewId("pay"),
    createdAt: now,
    ...payload,
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
    console.error("[stripe] Domain registration failed after payment", {
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

  let periodEnd: string | undefined;
  const subscriptionId = stripeObjectId(session.subscription);
  if (subscriptionId) {
    try {
      const subscription = await requireStripe().subscriptions.retrieve(subscriptionId);
      periodEnd = subscriptionPeriodEndIso(subscription);
    } catch {
      /* use default window */
    }
  }

  await upsertLocalSubscription({
    scope,
    planId,
    status: "active",
    stripeCustomerId: stripeObjectId(session.customer),
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: periodEnd,
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

async function recordAffiliateCommission(input: {
  scope: TenantScope;
  amount: number;
  currency: string;
  email?: string;
  stripeCheckoutSessionId?: string;
  stripeInvoiceId?: string;
}) {
  if (input.amount <= 0) return;
  try {
    const { recordCommissionForPaidInvoice } = await import("@/lib/affiliate/service");
    await recordCommissionForPaidInvoice({
      tenantId: input.scope.tenantId,
      amount: input.amount,
      currency: input.currency,
      email: input.email,
      stripeCheckoutSessionId: input.stripeCheckoutSessionId,
      stripeInvoiceId: input.stripeInvoiceId,
    });
  } catch (err) {
    console.warn("[affiliate] commission on payment failed", err);
  }
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const scope = scopeFromMetadata(session.metadata ?? {});
  if (!scope) {
    console.warn("[stripe] checkout.session.completed missing tenant metadata");
    return;
  }

  if (!checkoutPaid(session)) {
    await markPayment(session, scope, "pending");
    return;
  }

  await markPayment(session, scope, "paid");
  const kind = session.metadata?.kind;

  if (kind === "domain") {
    await completeDomainOrder(session, scope);
  } else if (kind === "saas_plan") {
    await upsertSaasSubscription(session, scope);
    await recordAffiliateCommission({
      scope,
      amount: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? "gbp").toUpperCase(),
      email: session.customer_details?.email ?? undefined,
      stripeCheckoutSessionId: session.id,
    });
  } else if (kind === "hosting") {
    await applyHostingSubscription(session, scope);
  }
}

export async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const scope = scopeFromMetadata(session.metadata ?? {});
  if (!scope) return;
  await markPayment(session, scope, "canceled");
}

export async function handleCheckoutPaymentFailed(session: Stripe.Checkout.Session) {
  const scope = scopeFromMetadata(session.metadata ?? {});
  if (!scope) return;
  await markPayment(session, scope, "failed");
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const scope = scopeFromMetadata(subscription.metadata ?? {});
  if (!scope || subscription.metadata?.kind !== "saas_plan") return;

  const planId = subscription.metadata.planId as BillingPlanId | undefined;
  if (!planId) return;

  await upsertLocalSubscription({
    scope,
    planId,
    status: mapStripeSubscriptionStatus(subscription.status),
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: stripeObjectId(subscription.customer),
    currentPeriodEnd: subscriptionPeriodEndIso(subscription),
  });
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  const stripe = requireStripe();
  let scope = scopeFromMetadata(invoice.parent?.subscription_details?.metadata ?? invoice.metadata);

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    scope = scope ?? scopeFromMetadata(subscription.metadata);
    if (scope && subscription.metadata?.kind === "saas_plan") {
      const planId = subscription.metadata.planId as BillingPlanId | undefined;
      if (planId) {
        await upsertLocalSubscription({
          scope,
          planId,
          status: mapStripeSubscriptionStatus(subscription.status),
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: stripeObjectId(subscription.customer),
          currentPeriodEnd: subscriptionPeriodEndIso(subscription),
        });
      }
    }
  }

  if (!scope) return;

  await postPaidInvoiceToFinance(invoice, scope);
  await recordAffiliateCommission({
    scope,
    amount: (invoice.amount_paid ?? 0) / 100,
    currency: (invoice.currency ?? "gbp").toUpperCase(),
    email: invoice.customer_email ?? undefined,
    stripeInvoiceId: invoice.id,
  });
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  const stripe = requireStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const scope = scopeFromMetadata(subscription.metadata);
  const planId = subscription.metadata?.planId as BillingPlanId | undefined;
  if (!scope || !planId || subscription.metadata?.kind !== "saas_plan") return;

  await upsertLocalSubscription({
    scope,
    planId,
    status: "past_due",
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: stripeObjectId(subscription.customer),
    currentPeriodEnd: subscriptionPeriodEndIso(subscription),
  });
}

async function postPaidInvoiceToFinance(invoice: Stripe.Invoice, scope: TenantScope) {
  if (!invoice.id) return;
  const number = invoice.number ? `STRIPE-${invoice.number}` : `STRIPE-${invoice.id}`;
  const finance = getFinanceStore();
  const existing = await finance.list(scope);
  if (existing.some((row) => row.number === number)) return;

  const amount = (invoice.amount_paid || invoice.amount_due || 0) / 100;
  if (amount <= 0) return;

  const created = await finance.create({
    ...scope,
    number,
    clientName: invoice.customer_name || invoice.customer_email || "Aarvanta OS customer",
    amount,
    currency: (invoice.currency ?? "gbp").toUpperCase(),
    status: "paid",
    dueDate: invoice.due_date
      ? new Date(invoice.due_date * 1000).toISOString().slice(0, 10)
      : crmNow().slice(0, 10),
    createdAt: crmNow(),
  });

  try {
    await postInvoiceToLedger(scope, created);
  } catch (error) {
    console.warn("[stripe] finance ledger post skipped", error);
  }
}

export async function listCustomerInvoices(
  customerId: string
): Promise<BillingInvoiceView[]> {
  const stripe = requireStripe();
  const invoices = await stripe.invoices.list({ customer: customerId, limit: 12 });
  return invoices.data.map((invoice) => ({
    id: invoice.id ?? "",
    number: invoice.number,
    status: invoice.status ?? "open",
    amountPaid: (invoice.amount_paid ?? 0) / 100,
    amountDue: (invoice.amount_due ?? 0) / 100,
    currency: (invoice.currency ?? "gbp").toUpperCase(),
    createdAt: new Date((invoice.created ?? 0) * 1000).toISOString(),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    paid: invoice.status === "paid",
  }));
}

export async function fulfillCheckoutSessionById(sessionId: string, expectedScope: TenantScope) {
  const stripe = requireStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const scope = scopeFromMetadata(session.metadata);
  if (!scope || scope.tenantId !== expectedScope.tenantId) {
    throw new Error("Checkout session does not belong to this workspace.");
  }
  if (session.status === "expired") {
    await handleCheckoutSessionExpired(session);
    return { status: "canceled" as const, session };
  }
  if (session.payment_status === "unpaid" && session.status !== "complete") {
    return { status: "pending" as const, session };
  }
  await handleCheckoutSessionCompleted(session);
  return {
    status: checkoutPaid(session) ? ("paid" as const) : ("pending" as const),
    session,
  };
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { getDomainOrderRepository } from "@/lib/data/domain-order-store";
import { getStripePaymentStore } from "@/lib/data/stripe-payment-store";
import { isDemoMode } from "@/lib/config/app-mode";
import { createDomainPurchaseOrder } from "@/lib/site-builder/domain-purchase";
import {
  createDomainCheckoutSession,
  createHostingCheckoutSession,
} from "@/lib/stripe/checkout";
import { getHostingPlan } from "@/lib/stripe/catalog";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("domain"),
    domain: z.string().min(4).max(120),
    tld: z.string().min(2).max(12),
    priceAnnual: z.number().positive(),
    currency: z.enum(["GBP", "USD"]),
    autoRenew: z.boolean().default(true),
    buildJobId: z.string().optional(),
  }),
  z.object({
    kind: z.literal("hosting"),
    hostingPlanId: z.enum([
      "hosting_starter",
      "hosting_standard",
      "hosting_growth",
    ]),
    buildJobId: z.string().optional(),
    domain: z.string().optional(),
  }),
]);

export async function POST(req: Request) {
  let session;
  try {
    session = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  if (!isStripeConfigured()) {
    if (isDemoMode()) {
      return NextResponse.json({
        demo: true,
        message:
          "Stripe is not configured — use the demo Buy now path, or set STRIPE_SECRET_KEY for live checkout.",
        kind: parsed.data.kind,
      });
    }
    return NextResponse.json(
      {
        error: {
          code: "STRIPE_NOT_CONFIGURED",
          message: "Set STRIPE_SECRET_KEY to enable checkout.",
        },
      },
      { status: 503 }
    );
  }

  const now = crmNow();

  if (parsed.data.kind === "domain") {
    const order = createDomainPurchaseOrder({
      scope: session.scope,
      domain: parsed.data.domain,
      tld: parsed.data.tld,
      priceAnnual: parsed.data.priceAnnual,
      currency: parsed.data.currency,
      autoRenew: parsed.data.autoRenew,
      buildJobId: parsed.data.buildJobId,
      status: "pending_payment",
    });
    await getDomainOrderRepository().save(order);

    const checkout = await createDomainCheckoutSession({
      scope: session.scope,
      domain: parsed.data.domain,
      tld: parsed.data.tld,
      priceAnnual: parsed.data.priceAnnual,
      currency: parsed.data.currency,
      autoRenew: parsed.data.autoRenew,
      orderId: order.id,
      buildJobId: parsed.data.buildJobId,
      email: session.email,
      name: session.name,
    });

    await getDomainOrderRepository().save({
      ...order,
      stripeCheckoutSessionId: checkout.id,
    });

    await getStripePaymentStore().save({
      ...session.scope,
      id: crmNewId("pay"),
      kind: "domain",
      status: "pending",
      stripeCheckoutSessionId: checkout.id,
      amount: parsed.data.priceAnnual,
      currency: parsed.data.currency,
      description: `Domain ${parsed.data.domain}`,
      metadata: { orderId: order.id, domain: parsed.data.domain },
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      url: checkout.url,
      sessionId: checkout.id,
      orderId: order.id,
    });
  }

  const hosting = getHostingPlan(parsed.data.hostingPlanId);
  if (!hosting) {
    return NextResponse.json(
      { error: { code: "UNKNOWN_PLAN", message: "Hosting plan not found" } },
      { status: 404 }
    );
  }

  const checkout = await createHostingCheckoutSession({
    scope: session.scope,
    hostingPlanId: parsed.data.hostingPlanId,
    buildJobId: parsed.data.buildJobId,
    domain: parsed.data.domain,
    email: session.email,
    name: session.name,
  });

  await getStripePaymentStore().save({
    ...session.scope,
    id: crmNewId("pay"),
    kind: "hosting",
    status: "pending",
    stripeCheckoutSessionId: checkout.id,
    amount: hosting.priceMonthly,
    currency: hosting.currency,
    description: hosting.name,
    metadata: {
      hostingPlanId: hosting.id,
      instanceType: hosting.instanceType,
      buildJobId: parsed.data.buildJobId ?? "",
    },
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    url: checkout.url,
    sessionId: checkout.id,
    hostingPlanId: hosting.id,
  });
}

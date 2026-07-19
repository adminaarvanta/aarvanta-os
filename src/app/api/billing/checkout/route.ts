import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { getStripePaymentStore } from "@/lib/data/stripe-payment-store";
import { isDemoMode } from "@/lib/config/app-mode";
import { createSaasCheckoutSession } from "@/lib/stripe/checkout";
import { getSaasPlan } from "@/lib/stripe/catalog";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getSessionContext } from "@/lib/tenant/context";
import type { BillingPlanId } from "@/types/platform-modules";

const schema = z.object({
  planId: z.enum(["starter", "growth", "scale", "enterprise"]),
});

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

  const plan = getSaasPlan(parsed.data.planId as BillingPlanId);
  if (!plan) {
    return NextResponse.json(
      { error: { code: "UNKNOWN_PLAN", message: "Plan not found" } },
      { status: 404 }
    );
  }

  if (!isStripeConfigured()) {
    if (isDemoMode()) {
      return NextResponse.json({
        demo: true,
        message:
          "Stripe is not configured. In demo mode, treat this as a successful checkout simulation.",
        planId: plan.id,
      });
    }
    return NextResponse.json(
      {
        error: {
          code: "STRIPE_NOT_CONFIGURED",
          message: "Set STRIPE_SECRET_KEY to enable live checkout.",
        },
      },
      { status: 503 }
    );
  }

  const checkout = await createSaasCheckoutSession({
    scope: session.scope,
    planId: parsed.data.planId,
    email: session.email,
    name: session.name,
  });

  const now = crmNow();
  await getStripePaymentStore().save({
    ...session.scope,
    id: crmNewId("pay"),
    kind: "saas_plan",
    status: "pending",
    stripeCheckoutSessionId: checkout.id,
    stripeCustomerId:
      typeof checkout.customer === "string" ? checkout.customer : undefined,
    amount: plan.priceMonthly,
    currency: plan.currency,
    description: `Aarvanta OS ${plan.name}`,
    metadata: { planId: plan.id },
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ url: checkout.url, sessionId: checkout.id });
}

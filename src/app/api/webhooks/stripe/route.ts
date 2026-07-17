import { NextResponse } from "next/server";
import { crmNow } from "@/lib/data/crm-helpers";
import { getStripeWebhookStore } from "@/lib/data/stripe-payment-store";
import { requireStripe } from "@/lib/stripe/client";
import { getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe/config";
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
} from "@/lib/stripe/webhook-handlers";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: { code: "STRIPE_NOT_CONFIGURED", message: "Stripe is not configured" } },
      { status: 503 }
    );
  }

  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json(
      {
        error: {
          code: "WEBHOOK_SECRET_MISSING",
          message: "STRIPE_WEBHOOK_SECRET is required",
        },
      },
      { status: 503 }
    );
  }

  const stripe = requireStripe();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: { code: "MISSING_SIGNATURE", message: "Missing stripe-signature" } },
      { status: 400 }
    );
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json(
      { error: { code: "INVALID_SIGNATURE", message } },
      { status: 400 }
    );
  }

  const webhookStore = getStripeWebhookStore();
  if (await webhookStore.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    await webhookStore.mark({
      id: event.id,
      stripeEventId: event.id,
      type: event.type,
      processedAt: crmNow(),
      tenantId: "_system",
      workspaceId: "_system",
      companyId: "_system",
    });
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return NextResponse.json(
      { error: { code: "HANDLER_FAILED", message: "Webhook handler failed" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

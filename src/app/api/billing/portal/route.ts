import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getBillingStore } from "@/lib/data/platform-store";
import { isDemoMode } from "@/lib/config/app-mode";
import { createBillingPortalSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getSessionContext } from "@/lib/tenant/context";

export async function POST() {
  let session;
  try {
    session = await getSessionContext();
  } catch {
    return unauthorized();
  }

  if (!isStripeConfigured()) {
    if (isDemoMode()) {
      return NextResponse.json({
        demo: true,
        message: "Stripe Customer Portal is unavailable until STRIPE_SECRET_KEY is set.",
      });
    }
    return NextResponse.json(
      {
        error: {
          code: "STRIPE_NOT_CONFIGURED",
          message: "Set STRIPE_SECRET_KEY to open the billing portal.",
        },
      },
      { status: 503 }
    );
  }

  const subscriptions = await getBillingStore().list(session.scope);
  const customerId = subscriptions.find((s) => s.stripeCustomerId)?.stripeCustomerId;
  if (!customerId) {
    return NextResponse.json(
      {
        error: {
          code: "NO_CUSTOMER",
          message: "No Stripe customer on file. Subscribe to a plan first.",
        },
      },
      { status: 400 }
    );
  }

  const portal = await createBillingPortalSession({ stripeCustomerId: customerId });
  return NextResponse.json({ url: portal.url });
}

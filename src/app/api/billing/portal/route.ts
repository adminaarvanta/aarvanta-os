import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/api/request";
import { isDemoMode } from "@/lib/config/app-mode";
import { createBillingPortalSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe/config";
import { resolveStoredStripeCustomerId } from "@/lib/stripe/customer";
import { requirePermission } from "@/lib/tenant/context";

export async function POST() {
  let session;
  try {
    session = await requirePermission("org:billing");
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { code: "PORTAL_ERROR", message: "Could not open billing portal" } },
      { status: 500 }
    );
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

  const customerId = await resolveStoredStripeCustomerId(session.scope);
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, parseJsonBody } from "@/lib/api/request";
import { isStripeConfigured } from "@/lib/stripe/config";
import { fulfillCheckoutSessionById } from "@/lib/stripe/webhook-handlers";
import { requirePermission } from "@/lib/tenant/context";

const schema = z.object({
  sessionId: z.string().min(8).max(200),
});

/** Confirm a Checkout return even if the Stripe webhook is delayed. */
export async function POST(req: Request) {
  let session;
  try {
    session = await requirePermission("org:billing");
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { code: "SYNC_ERROR", message: "Could not confirm payment" } },
      { status: 500 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: { code: "STRIPE_NOT_CONFIGURED", message: "Stripe is not configured" } },
      { status: 503 }
    );
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "sessionId is required" } },
      { status: 400 }
    );
  }

  try {
    const result = await fulfillCheckoutSessionById(
      parsed.data.sessionId,
      session.scope
    );
    return NextResponse.json({
      status: result.status,
      planId: result.session.metadata?.planId,
      kind: result.session.metadata?.kind,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not confirm payment";
    const status = message.includes("does not belong") ? 403 : 400;
    return NextResponse.json({ error: { code: "SYNC_FAILED", message } }, { status });
  }
}

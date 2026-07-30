import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import {
  applyAsExternalPartner,
  optInAsCustomerAffiliate,
} from "@/lib/affiliate/service";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";

const applySchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(160),
  country: z.string().min(2).max(80),
  company: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  phone: z.string().max(24).optional(),
  marketingChannels: z.string().max(240).optional(),
});

/** Public partner application (pending until admin approves). */
export async function POST(req: Request) {
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid application.",
      400
    );
  }

  let userId: string | undefined;
  let tenantId: string | undefined;
  try {
    const session = await getSessionContext();
    // Only link the session account when the applicant email matches —
    // otherwise an admin testing apply would steal the partner's userId.
    if (
      session.email.trim().toLowerCase() ===
      parsed.data.email.trim().toLowerCase()
    ) {
      userId = session.userId;
      tenantId = session.scope.tenantId;
    }
  } catch {
    /* anonymous apply */
  }

  try {
    const affiliate = await applyAsExternalPartner({
      ...parsed.data,
      userId,
      tenantId,
    });
    return NextResponse.json({ affiliate });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Application failed.";
    return apiError("AFFILIATE_APPLY_ERROR", message, 400);
  }
}

/** Customer in-app referral opt-in → active affiliate. */
export async function PUT() {
  let session;
  try {
    session = await getSessionContext();
  } catch {
    return unauthorized();
  }

  try {
    const affiliate = await optInAsCustomerAffiliate({
      userId: session.userId,
      tenantId: session.scope.tenantId,
      email: session.email,
      name: session.name || session.email,
      country: session.member?.country || "United Kingdom",
      company: session.member?.companyName,
    });
    return NextResponse.json({ affiliate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Opt-in failed.";
    return apiError("AFFILIATE_OPTIN_ERROR", message, 400);
  }
}

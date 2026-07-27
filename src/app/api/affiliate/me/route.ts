import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import { affiliateStore } from "@/lib/data/affiliate-store";
import {
  buildAffiliateDashboard,
  requestPayout,
  updateAffiliateProfile,
} from "@/lib/affiliate/service";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";

async function resolveAffiliateForSession() {
  const session = await getSessionContext();
  const byUser = await affiliateStore.getAffiliateByUserId(session.userId);
  if (byUser) return { session, affiliate: byUser };
  const byEmail = await affiliateStore.getAffiliateByEmail(session.email);
  return { session, affiliate: byEmail };
}

export async function GET() {
  try {
    const { affiliate } = await resolveAffiliateForSession();
    if (!affiliate) {
      return NextResponse.json({ affiliate: null, dashboard: null });
    }
    const dashboard = await buildAffiliateDashboard(affiliate.id);
    return NextResponse.json({ affiliate, dashboard });
  } catch {
    return unauthorized();
  }
}

const profileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  company: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  phone: z.string().max(24).optional(),
  country: z.string().min(2).max(80).optional(),
  taxId: z.string().max(80).optional(),
  payoutMethod: z.string().max(80).optional(),
  payoutDetails: z.string().max(240).optional(),
  marketingChannels: z.string().max(240).optional(),
});

export async function PATCH(req: Request) {
  let resolved;
  try {
    resolved = await resolveAffiliateForSession();
  } catch {
    return unauthorized();
  }
  if (!resolved.affiliate) {
    return apiError("NOT_AFFILIATE", "No affiliate profile found.", 404);
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid profile.",
      400
    );
  }

  const affiliate = await updateAffiliateProfile(
    resolved.affiliate.id,
    parsed.data
  );
  return NextResponse.json({ affiliate });
}

const payoutSchema = z.object({
  amount: z.number().positive(),
  method: z.string().max(80).optional(),
  details: z.string().max(240).optional(),
});

export async function POST(req: Request) {
  let resolved;
  try {
    resolved = await resolveAffiliateForSession();
  } catch {
    return unauthorized();
  }
  if (!resolved.affiliate) {
    return apiError("NOT_AFFILIATE", "No affiliate profile found.", 404);
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = payoutSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid payout request.",
      400
    );
  }

  try {
    const { payout } = await requestPayout({
      affiliateId: resolved.affiliate.id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      details: parsed.data.details,
    });
    return NextResponse.json({ payout });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payout request failed.";
    return apiError("PAYOUT_ERROR", message, 400);
  }
}

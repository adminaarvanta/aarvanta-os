import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import { isAffiliatePlatformAdmin } from "@/lib/affiliate/admin";
import {
  adminApproveEarning,
  adminClawbackEarning,
  adminSetAffiliateStatus,
  adminUpdatePayout,
  adminUpsertRateCard,
  approveMaturedEarnings,
} from "@/lib/affiliate/service";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { getSessionContext } from "@/lib/tenant/context";
import type { AffiliateRateCard } from "@/types/affiliate";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getSessionContext();
  if (!isAffiliatePlatformAdmin(session.email)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    if (message === "Forbidden") {
      return apiError("FORBIDDEN", "Affiliate admin access required.", 403);
    }
    return unauthorized();
  }

  await approveMaturedEarnings();
  const [affiliates, rateCards, earnings, payouts, leads, auditLogs] =
    await Promise.all([
      affiliateStore.listAffiliates(),
      affiliateStore.listRateCards(),
      affiliateStore.listEarnings(),
      affiliateStore.listPayouts(),
      affiliateStore.listLeadEvents(),
      affiliateStore.listAuditLogs(),
    ]);

  return NextResponse.json({
    affiliates,
    rateCards,
    earnings,
    payouts,
    leads,
    auditLogs: auditLogs.slice(0, 100),
  });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_status"),
    affiliateId: z.string(),
    status: z.enum(["active", "suspended", "rejected"]),
  }),
  z.object({
    action: z.literal("upsert_rate_card"),
    rateCard: z.object({
      id: z.string(),
      regionCode: z.string(),
      affiliateId: z.string().optional(),
      currency: z.string(),
      maxDiscountPercent: z.number(),
      defaultDiscountPercent: z.number(),
      maxCpaAmount: z.number(),
      defaultCpaAmount: z.number(),
      maxCommissionPercent: z.number(),
      defaultCommissionPercent: z.number(),
      attributionWindowDays: z.number(),
      payoutMinimum: z.number(),
    }),
  }),
  z.object({
    action: z.literal("payout"),
    payoutId: z.string(),
    status: z.enum(["approved", "rejected", "paid"]),
    adminNote: z.string().max(240).optional(),
  }),
  z.object({
    action: z.literal("approve_earning"),
    earningId: z.string(),
  }),
  z.object({
    action: z.literal("clawback_earning"),
    earningId: z.string(),
  }),
]);

export async function PATCH(req: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    if (message === "Forbidden") {
      return apiError("FORBIDDEN", "Affiliate admin access required.", 403);
    }
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid admin action.",
      400
    );
  }

  try {
    const data = parsed.data;
    if (data.action === "set_status") {
      const affiliate = await adminSetAffiliateStatus({
        affiliateId: data.affiliateId,
        status: data.status,
        actorEmail: session.email,
      });
      return NextResponse.json({ affiliate });
    }
    if (data.action === "upsert_rate_card") {
      const rateCard = await adminUpsertRateCard(
        {
          ...(data.rateCard as AffiliateRateCard),
          updatedAt: new Date().toISOString(),
        },
        session.email
      );
      return NextResponse.json({ rateCard });
    }
    if (data.action === "payout") {
      const payout = await adminUpdatePayout({
        payoutId: data.payoutId,
        status: data.status,
        actorEmail: session.email,
        adminNote: data.adminNote,
      });
      return NextResponse.json({ payout });
    }
    if (data.action === "approve_earning") {
      const earning = await adminApproveEarning({
        earningId: data.earningId,
        actorEmail: session.email,
      });
      return NextResponse.json({ earning });
    }
    const earning = await adminClawbackEarning({
      earningId: data.earningId,
      actorEmail: session.email,
    });
    return NextResponse.json({ earning });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin action failed.";
    return apiError("AFFILIATE_ADMIN_ERROR", message, 400);
  }
}

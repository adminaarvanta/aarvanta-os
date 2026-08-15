import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import { isAffiliatePlatformAdmin } from "@/lib/affiliate/admin";
import {
  adminApproveEarning,
  adminAssignHierarchy,
  adminClawbackEarning,
  adminSetAffiliateStatus,
  adminUpdatePayout,
  adminUpsertRateCard,
  affiliateRole,
  approveMaturedEarnings,
  buildTree,
  resendAffiliateActivation,
  scopedAffiliatesForManager,
} from "@/lib/affiliate/service";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { getSessionContext } from "@/lib/tenant/context";
import type { Affiliate, AffiliateRateCard } from "@/types/affiliate";

export const runtime = "nodejs";

type AdminAccess =
  | { kind: "platform"; email: string }
  | { kind: "regional_manager"; email: string; affiliate: Affiliate };

async function resolveAdminAccess(): Promise<AdminAccess> {
  const session = await getSessionContext();
  if (isAffiliatePlatformAdmin(session.email)) {
    return { kind: "platform", email: session.email };
  }

  const me =
    (await affiliateStore.getAffiliateByUserId(session.userId)) ??
    (await affiliateStore.getAffiliateByEmail(session.email));
  if (me && affiliateRole(me) === "regional_manager" && me.status === "active") {
    return { kind: "regional_manager", email: session.email, affiliate: me };
  }

  throw new Error("Forbidden");
}

async function withPasswordFlags(affiliates: Affiliate[]) {
  const { hasUserPassword } = await import("@/lib/auth/user-credentials");
  const flagged = (
    await Promise.all(
      affiliates.map(async (a) => {
        const email = a.profile?.email?.trim().toLowerCase();
        if (!email) {
          console.warn(
            "[affiliate] skipping affiliate with missing profile.email",
            a.id
          );
          return null;
        }
        const needsPasswordSetup =
          (a.status === "active" || a.status === "pending") &&
          !(await hasUserPassword(email));
        return {
          ...a,
          role: affiliateRole(a),
          needsPasswordSetup,
        };
      })
    )
  ).filter((a): a is NonNullable<typeof a> => a !== null);

  flagged.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });
  return flagged;
}

export async function GET() {
  let access: AdminAccess;
  try {
    access = await resolveAdminAccess();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    if (message === "Forbidden") {
      return apiError("FORBIDDEN", "Affiliate admin access required.", 403);
    }
    return unauthorized();
  }

  await approveMaturedEarnings();
  const allAffiliates = await affiliateStore.listAffiliates();

  if (access.kind === "platform") {
    const [rateCards, earnings, payouts, leads, auditLogs] = await Promise.all([
      affiliateStore.listRateCards(),
      affiliateStore.listEarnings(),
      affiliateStore.listPayouts(),
      affiliateStore.listLeadEvents(),
      affiliateStore.listAuditLogs(),
    ]);
    const affiliates = await withPasswordFlags(allAffiliates);
    return NextResponse.json({
      access: "platform",
      affiliates,
      tree: buildTree(affiliates),
      rateCards,
      earnings,
      payouts,
      leads,
      auditLogs: auditLogs.slice(0, 100),
    });
  }

  const scoped = scopedAffiliatesForManager(allAffiliates, access.affiliate);
  const scopedIds = new Set(scoped.map((a) => a.id));
  const region = access.affiliate.profile.regionCode;
  const [rateCards, earnings, payouts, leads] = await Promise.all([
    affiliateStore.listRateCards(),
    affiliateStore.listEarnings(),
    affiliateStore.listPayouts(),
    affiliateStore.listLeadEvents(),
  ]);

  const affiliates = await withPasswordFlags(scoped);
  return NextResponse.json({
    access: "regional_manager",
    regionCode: region,
    managerAffiliateId: access.affiliate.id,
    affiliates,
    tree: buildTree(affiliates),
    rateCards: rateCards.filter(
      (c) => !c.affiliateId && c.regionCode === region
    ),
    earnings: earnings.filter((e) => scopedIds.has(e.affiliateId)),
    payouts: payouts.filter((p) => scopedIds.has(p.affiliateId)),
    leads: leads.filter((l) => scopedIds.has(l.affiliateId)),
    auditLogs: [],
  });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_status"),
    affiliateId: z.string(),
    status: z.enum(["active", "suspended", "rejected"]),
    parentAffiliateId: z.string().nullable().optional(),
    role: z.enum(["partner", "regional_manager"]).optional(),
  }),
  z.object({
    action: z.literal("assign_hierarchy"),
    affiliateId: z.string(),
    parentAffiliateId: z.string().nullable().optional(),
    role: z.enum(["partner", "regional_manager"]).optional(),
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
  z.object({
    action: z.literal("resend_activation"),
    affiliateId: z.string(),
  }),
]);

export async function PATCH(req: Request) {
  let access: AdminAccess;
  try {
    access = await resolveAdminAccess();
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

    if (access.kind === "regional_manager") {
      const region = access.affiliate.profile.regionCode;

      if (data.action === "upsert_rate_card") {
        if (data.rateCard.regionCode !== region || data.rateCard.affiliateId) {
          return apiError(
            "FORBIDDEN",
            `Regional managers may only edit the ${region} regional rate card.`,
            403
          );
        }
        const rateCard = await adminUpsertRateCard(
          {
            ...(data.rateCard as AffiliateRateCard),
            updatedAt: new Date().toISOString(),
          },
          access.email,
          { restrictRegionCode: region }
        );
        return NextResponse.json({ rateCard });
      }

      return apiError(
        "FORBIDDEN",
        "Regional managers can only update their region rate card.",
        403
      );
    }

    if (data.action === "set_status") {
      const result = await adminSetAffiliateStatus({
        affiliateId: data.affiliateId,
        status: data.status,
        actorEmail: access.email,
        parentAffiliateId: data.parentAffiliateId,
        role: data.role,
      });
      return NextResponse.json(result);
    }
    if (data.action === "assign_hierarchy") {
      const affiliate = await adminAssignHierarchy({
        affiliateId: data.affiliateId,
        actorEmail: access.email,
        parentAffiliateId: data.parentAffiliateId,
        role: data.role,
      });
      return NextResponse.json({ affiliate });
    }
    if (data.action === "resend_activation") {
      const result = await resendAffiliateActivation({
        affiliateId: data.affiliateId,
        actorEmail: access.email,
      });
      return NextResponse.json(result);
    }
    if (data.action === "upsert_rate_card") {
      const rateCard = await adminUpsertRateCard(
        {
          ...(data.rateCard as AffiliateRateCard),
          updatedAt: new Date().toISOString(),
        },
        access.email
      );
      return NextResponse.json({ rateCard });
    }
    if (data.action === "payout") {
      const payout = await adminUpdatePayout({
        payoutId: data.payoutId,
        status: data.status,
        actorEmail: access.email,
        adminNote: data.adminNote,
      });
      return NextResponse.json({ payout });
    }
    if (data.action === "approve_earning") {
      const earning = await adminApproveEarning({
        earningId: data.earningId,
        actorEmail: access.email,
      });
      return NextResponse.json({ earning });
    }
    const earning = await adminClawbackEarning({
      earningId: data.earningId,
      actorEmail: access.email,
    });
    return NextResponse.json({ earning });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin action failed.";
    return apiError("AFFILIATE_ADMIN_ERROR", message, 400);
  }
}

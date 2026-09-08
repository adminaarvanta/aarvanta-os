import { NextResponse } from "next/server";
import { filenameForExport, flattenForCsv, toCsv } from "@/lib/account/export";
import { apiError, unauthorized } from "@/lib/api/request";
import { buildAffiliateDashboard } from "@/lib/affiliate/service";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await getSessionContext();
    const affiliate =
      (await affiliateStore.getAffiliateByUserId(session.userId)) ??
      (await affiliateStore.getAffiliateByEmail(session.email));
    if (!affiliate) {
      return apiError("NOT_AFFILIATE", "No affiliate profile found.", 404);
    }

    const dashboard = await buildAffiliateDashboard(affiliate.id);
    if (!dashboard) {
      return apiError("NOT_FOUND", "Affiliate dashboard is empty.", 404);
    }

    const format = new URL(req.url).searchParams.get("format") ?? "json";
    const payload = {
      exportedAt: new Date().toISOString(),
      affiliate: {
        id: dashboard.affiliate.id,
        referralCode: dashboard.affiliate.referralCode,
        status: dashboard.affiliate.status,
        role: dashboard.affiliate.role,
        country: dashboard.affiliate.profile.country,
        city: dashboard.affiliate.profile.city,
      },
      rates: dashboard.rates,
      balance: dashboard.balance,
      stats: dashboard.stats,
      leads: dashboard.leads,
      earnings: dashboard.earnings,
      payouts: dashboard.payouts,
      downline: dashboard.downline,
    };

    if (format === "csv") {
      const rows = [
        ...dashboard.earnings.map((e) => ({
          kind: "earning",
          id: e.id,
          type: e.type,
          status: e.status,
          amount: e.amount,
          currency: e.currency,
          createdAt: e.createdAt,
        })),
        ...dashboard.leads.map((l) => ({
          kind: "lead",
          id: l.id,
          type: l.status,
          status: l.status,
          amount: "",
          currency: "",
          createdAt: l.createdAt,
        })),
        ...dashboard.payouts.map((p) => ({
          kind: "payout",
          id: p.id,
          type: p.method ?? "manual",
          status: p.status,
          amount: p.amount,
          currency: p.currency,
          createdAt: p.createdAt,
        })),
      ];
      const csv = toCsv(flattenForCsv(rows));
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filenameForExport("affiliate", "csv")}"`,
        },
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    if (message === "Unauthorized") return unauthorized();
    return apiError("EXPORT_ERROR", message, 500);
  }
}

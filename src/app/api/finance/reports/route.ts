import { NextResponse } from "next/server";
import {
  buildBalanceSheet,
  buildProfitAndLoss,
  buildTrialBalance,
} from "@/lib/finance/reports";
import { apiError } from "@/lib/api/request";
import { requirePermission } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await requirePermission("finance:read");
    const [trialBalance, profitAndLoss, balanceSheet] = await Promise.all([
      buildTrialBalance(ctx.scope),
      buildProfitAndLoss(ctx.scope),
      buildBalanceSheet(ctx.scope),
    ]);

    return NextResponse.json({ trialBalance, profitAndLoss, balanceSheet });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("REPORTS_ERROR", message, status);
  }
}

import { NextResponse } from "next/server";
import {
  buildBalanceSheet,
  buildCashSummary,
  buildProfitAndLoss,
  buildTrialBalance,
} from "@/lib/finance/reports";
import { apiError } from "@/lib/api/request";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { requirePermission } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await requirePermission("finance:read");
    await ensureFinanceStack(ctx.scope);
    const [trialBalance, profitAndLoss, balanceSheet, cash] = await Promise.all([
      buildTrialBalance(ctx.scope),
      buildProfitAndLoss(ctx.scope),
      buildBalanceSheet(ctx.scope),
      buildCashSummary(ctx.scope),
    ]);

    return NextResponse.json({
      trialBalance,
      profitAndLoss,
      balanceSheet,
      cash,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("REPORTS_ERROR", message, status);
  }
}

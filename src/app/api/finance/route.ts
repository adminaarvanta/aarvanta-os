import { NextResponse } from "next/server";
import { getFinanceStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const store = getFinanceStore();
    const [invoices, expenses, budgets] = await Promise.all([
      store.list(scope),
      store.listExpenses(scope),
      store.listBudgets(scope),
    ]);
    return NextResponse.json({ invoices, expenses, budgets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("FINANCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

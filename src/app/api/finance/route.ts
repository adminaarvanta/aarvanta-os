import { NextResponse } from "next/server";
import { getFinanceStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { displayInvoiceStatus } from "@/lib/finance/format";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    await ensureFinanceStack(scope);
    const store = getFinanceStore();
    const [invoices, expenses, budgets] = await Promise.all([
      store.list(scope),
      store.listExpenses(scope),
      store.listBudgets(scope),
    ]);
    return NextResponse.json({
      invoices: invoices.map((invoice) => ({
        ...invoice,
        status: displayInvoiceStatus(invoice.status, invoice.dueDate),
      })),
      expenses,
      budgets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("FINANCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

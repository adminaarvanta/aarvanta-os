import { FinanceOverviewClient } from "@/components/finance/finance-overview-client";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { displayInvoiceStatus } from "@/lib/finance/format";
import {
  buildBalanceSheet,
  buildCashSummary,
  buildProfitAndLoss,
} from "@/lib/finance/reports";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceOverviewPage() {
  const scope = await getTenantScope();
  await ensureFinanceStack(scope);
  const store = getFinanceStore();
  const [invoices, expenses, pl, balanceSheet, cash] = await Promise.all([
    store.list(scope),
    store.listExpenses(scope),
    buildProfitAndLoss(scope),
    buildBalanceSheet(scope),
    buildCashSummary(scope),
  ]);

  return (
    <FinanceOverviewClient
      initialInvoices={invoices.map((invoice) => ({
        ...invoice,
        status: displayInvoiceStatus(invoice.status, invoice.dueDate),
      }))}
      initialExpenses={expenses}
      initialPl={pl}
      initialBalanceSheet={balanceSheet}
      initialCash={cash}
    />
  );
}

export const metadata = { title: "Finance" };

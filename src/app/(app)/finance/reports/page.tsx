import { FinanceReportsClient } from "@/components/finance/finance-reports-client";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { displayInvoiceStatus } from "@/lib/finance/format";
import {
  buildBalanceSheet,
  buildCashSummary,
  buildProfitAndLoss,
  buildTrialBalance,
} from "@/lib/finance/reports";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceReportsPage() {
  const scope = await getTenantScope();
  await ensureFinanceStack(scope);
  const [trialBalance, profitAndLoss, balanceSheet, cash, invoices] = await Promise.all([
    buildTrialBalance(scope),
    buildProfitAndLoss(scope),
    buildBalanceSheet(scope),
    buildCashSummary(scope),
    getFinanceStore().list(scope),
  ]);

  return (
    <FinanceReportsClient
      initial={{ trialBalance, profitAndLoss, balanceSheet, cash }}
      invoices={invoices.map((invoice) => ({
        ...invoice,
        status: displayInvoiceStatus(invoice.status, invoice.dueDate),
      }))}
    />
  );
}

export const metadata = { title: "Finance · Reports" };

import { FinanceBudgetsClient } from "@/components/finance/finance-budgets-client";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceBudgetsPage() {
  const scope = await getTenantScope();
  await ensureFinanceStack(scope);
  const budgets = await getFinanceStore().listBudgets(scope);
  return <FinanceBudgetsClient initialBudgets={budgets} />;
}

export const metadata = { title: "Finance · Budgets" };

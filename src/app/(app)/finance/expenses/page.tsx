import { FinanceExpensesClient } from "@/components/finance/finance-expenses-client";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceExpensesPage() {
  const scope = await getTenantScope();
  await ensureFinanceStack(scope);
  const expenses = await getFinanceStore().listExpenses(scope);
  return <FinanceExpensesClient initialExpenses={expenses} />;
}

export const metadata = { title: "Finance · Expenses" };

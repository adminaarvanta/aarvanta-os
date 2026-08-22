import { FinanceAccountsClient } from "@/components/finance/finance-accounts-client";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceAccountsPage() {
  const scope = await getTenantScope();
  await ensureFinanceStack(scope);
  const accounts = await getFinanceStore().listChartOfAccounts(scope);
  return <FinanceAccountsClient initialAccounts={accounts} />;
}

export const metadata = { title: "Finance · Accounts" };

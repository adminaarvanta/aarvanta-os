import { FinanceLedgerClient } from "@/components/finance/finance-ledger-client";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceLedgerPage() {
  const scope = await getTenantScope();
  await ensureFinanceStack(scope);
  const store = getFinanceStore();
  const [journalEntries, accounts] = await Promise.all([
    store.listJournalEntries(scope),
    store.listChartOfAccounts(scope),
  ]);

  return (
    <FinanceLedgerClient
      initialEntries={[...journalEntries].sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      )}
      accounts={accounts}
    />
  );
}

export const metadata = { title: "Finance · Ledger" };

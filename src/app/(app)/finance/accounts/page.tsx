import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinancePanel,
  FinanceStatusChip,
} from "@/components/finance/finance-ui";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceAccountsPage() {
  const scope = await getTenantScope();
  const accounts = await getFinanceStore().listChartOfAccounts(scope);

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Chart of accounts"
        description="UK chart of accounts used by the ledger and reports."
      />
      <FinancePanel title="Accounts" description={`${accounts.length} codes`}>
        <FinanceDataTable
          empty="No chart of accounts yet. Provision via Launch OS (UK)."
          columns={[
            { key: "code", label: "Code" },
            { key: "name", label: "Name" },
            { key: "type", label: "Type" },
            { key: "vat", label: "VAT" },
            { key: "status", label: "Status" },
          ]}
          rows={accounts.map((account) => ({
            id: account.id,
            cells: {
              code: account.code,
              name: account.name,
              type: <FinanceStatusChip label={account.type} tone={account.type} />,
              vat: account.vatApplicable ? "Applicable" : "No VAT",
              status: (
                <FinanceStatusChip
                  label={account.active ? "active" : "inactive"}
                  tone={account.active ? "active" : "inactive"}
                />
              ),
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

export const metadata = { title: "Finance · Accounts" };

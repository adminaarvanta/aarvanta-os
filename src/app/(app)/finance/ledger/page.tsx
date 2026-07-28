import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinancePanel,
  FinanceStatusChip,
} from "@/components/finance/finance-ui";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceLedgerPage() {
  const scope = await getTenantScope();
  const journalEntries = await getFinanceStore().listJournalEntries(scope);

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Journal ledger"
        description="Double-entry journal posts that drive trial balance and reports."
      />
      <FinancePanel
        title="Journal entries"
        description={`${journalEntries.length} entries`}
      >
        <FinanceDataTable
          empty="No journal entries yet. Launch OS can provision a starter UK ledger."
          columns={[
            { key: "reference", label: "Reference" },
            { key: "description", label: "Description" },
            { key: "lines", label: "Lines", className: "text-right" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status" },
          ]}
          rows={journalEntries.map((entry) => ({
            id: entry.id,
            cells: {
              reference: entry.reference,
              description: entry.description,
              lines: String(entry.lines.length),
              date: entry.date,
              status: (
                <FinanceStatusChip
                  label={entry.status}
                  tone={entry.status === "posted" ? "posted" : "draft"}
                />
              ),
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

export const metadata = { title: "Finance · Ledger" };

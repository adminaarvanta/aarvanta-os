import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinancePanel,
  FinanceStatusChip,
} from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceInvoicesPage() {
  const scope = await getTenantScope();
  const invoices = await getFinanceStore().list(scope);

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Invoices"
        description="Client billing, payment status, and overdue follow-up."
      />
      <FinancePanel title="All invoices" description={`${invoices.length} records`}>
        <FinanceDataTable
          empty="No invoices yet."
          columns={[
            { key: "number", label: "Number" },
            { key: "client", label: "Client" },
            { key: "amount", label: "Amount", className: "text-right" },
            { key: "due", label: "Due" },
            { key: "status", label: "Status" },
          ]}
          rows={invoices.map((invoice) => ({
            id: invoice.id,
            cells: {
              number: invoice.number,
              client: invoice.clientName,
              amount: formatFinanceCurrency(invoice.amount, invoice.currency),
              due: new Date(invoice.dueDate).toLocaleDateString("en-GB"),
              status: (
                <FinanceStatusChip label={invoice.status} tone={invoice.status} />
              ),
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

export const metadata = { title: "Finance · Invoices" };

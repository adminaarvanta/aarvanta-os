import { FinanceCustomersClient } from "@/components/finance/finance-customers-client";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { displayInvoiceStatus } from "@/lib/finance/format";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceCustomersPage() {
  const scope = await getTenantScope();
  await ensureFinanceStack(scope);
  const invoices = await getFinanceStore().list(scope);
  return (
    <FinanceCustomersClient
      initialInvoices={invoices.map((invoice) => ({
        ...invoice,
        status: displayInvoiceStatus(invoice.status, invoice.dueDate),
      }))}
    />
  );
}

export const metadata = { title: "Finance · Customers" };

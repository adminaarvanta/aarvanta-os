"use client";

import { useEffect, useMemo, useState } from "react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { FinanceInvoiceCreateForm } from "@/components/finance/finance-create-forms";
import { FinancePageHeader } from "@/components/finance/finance-nav";
import { FinanceDataTable, FinancePanel } from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import type { FinanceInvoice } from "@/types/platform-modules";

type CustomerRow = {
  name: string;
  invoices: number;
  billed: number;
  paid: number;
  outstanding: number;
};

export function FinanceCustomersClient({
  initialInvoices,
}: {
  initialInvoices: FinanceInvoice[];
}) {
  const [invoices, setInvoices] = useState(initialInvoices);

  async function reload() {
    const res = await fetch("/api/finance/invoices");
    if (res.ok) {
      const data = (await res.json()) as { invoices: FinanceInvoice[] };
      setInvoices(data.invoices);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerRow>();
    for (const invoice of invoices) {
      const key = invoice.clientName.trim() || "Unknown";
      const row = map.get(key) ?? {
        name: key,
        invoices: 0,
        billed: 0,
        paid: 0,
        outstanding: 0,
      };
      row.invoices += 1;
      row.billed += invoice.amount;
      if (invoice.status === "paid") row.paid += invoice.amount;
      if (invoice.status === "sent" || invoice.status === "overdue") {
        row.outstanding += invoice.amount;
      }
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.outstanding - a.outstanding || b.billed - a.billed);
  }, [invoices]);

  return (
    <div className="space-y-5">
      <FinancePageHeader
        title="Customers"
        description="People and companies you invoice. Add a customer by creating an invoice with their name."
        actions={
          <PendingLink
            href="/finance/invoices"
            className="inline-flex items-center justify-center rounded-lg bg-[color:var(--finance-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            Invoice a customer
          </PendingLink>
        }
      />
      <FinancePanel
        title="Invoice a customer"
        description="A new customer is created when you save an invoice in their name."
      >
        <FinanceInvoiceCreateForm
          customerNames={customers.map((customer) => customer.name)}
          onCreated={reload}
        />
      </FinancePanel>
      <FinancePanel title="Customer balances" description={`${customers.length} customers`}>
        <FinanceDataTable
          empty="No customers yet. Create an invoice to add one."
          columns={[
            { key: "name", label: "Customer" },
            { key: "invoices", label: "Invoices", className: "text-right" },
            { key: "billed", label: "Billed", className: "text-right" },
            { key: "paid", label: "Paid", className: "text-right" },
            { key: "outstanding", label: "Outstanding", className: "text-right" },
          ]}
          rows={customers.map((customer) => ({
            id: customer.name,
            cells: {
              name: customer.name,
              invoices: customer.invoices,
              billed: formatFinanceCurrency(customer.billed),
              paid: formatFinanceCurrency(customer.paid),
              outstanding: formatFinanceCurrency(customer.outstanding),
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

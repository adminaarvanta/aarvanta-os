"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FinanceInvoiceCreateForm } from "@/components/finance/finance-create-forms";
import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinancePanel,
  FinanceStatusChip,
} from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import type { FinanceInvoice } from "@/types/platform-modules";

function apiMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { message?: string } | string }).error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  }
  return fallback;
}

export function FinanceInvoicesClient({
  initialInvoices,
}: {
  initialInvoices: FinanceInvoice[];
}) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [filter, setFilter] = useState<"all" | "unpaid" | "overdue" | "paid">("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/finance/invoices");
    if (res.ok) {
      const data = (await res.json()) as { invoices: FinanceInvoice[] };
      setInvoices(data.invoices);
    }
    router.refresh();
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAction(id: string, action: "send" | "pay" | "delete") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(apiMessage(data, "Could not update invoice"));
        return;
      }
      if (action === "send") setMessage("Invoice sent — sales posted to the ledger.");
      if (action === "pay") setMessage("Payment recorded — cash in bank, receivable cleared.");
      if (action === "delete") setMessage("Draft deleted.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const visible = useMemo(() => {
    return invoices.filter((invoice) => {
      if (filter === "paid") return invoice.status === "paid";
      if (filter === "overdue") return invoice.status === "overdue";
      if (filter === "unpaid") return invoice.status === "sent" || invoice.status === "overdue";
      return true;
    });
  }, [filter, invoices]);

  const unpaid = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="space-y-5">
      <FinancePageHeader
        title="Invoices"
        description="Create a draft, send it to recognise income, then record the payment when cash arrives."
      />
      {message ? (
        <p className="text-sm text-[color:var(--finance-profit)]">{message}</p>
      ) : null}

      <FinancePanel
        title="Create invoice"
        description="Fill in the customer and amount. Save a draft, then Send when it should hit the books."
      >
        <FinanceInvoiceCreateForm
          customerNames={invoices.map((invoice) => invoice.clientName)}
          onCreated={refresh}
        />
      </FinancePanel>

      <FinancePanel
        title="All invoices"
        description={`${visible.length} shown · ${formatFinanceCurrency(unpaid)} to collect`}
        actions={
          <div className="flex flex-wrap gap-1">
            {(["all", "unpaid", "overdue", "paid"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                  filter === key
                    ? "bg-[color:var(--finance-accent)] text-white"
                    : "bg-surface-muted text-muted hover:text-foreground"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        }
      >
        <FinanceDataTable
          empty="No invoices yet. Create a draft above."
          columns={[
            { key: "number", label: "Number" },
            { key: "client", label: "Customer" },
            { key: "memo", label: "Memo" },
            { key: "amount", label: "Amount", className: "text-right" },
            { key: "due", label: "Due" },
            { key: "status", label: "Status" },
            { key: "actions", label: "" },
          ]}
          rows={visible.map((invoice) => ({
            id: invoice.id,
            cells: {
              number: invoice.number,
              client: invoice.clientName,
              memo: invoice.description || "—",
              amount: formatFinanceCurrency(invoice.amount, invoice.currency),
              due: new Date(invoice.dueDate).toLocaleDateString("en-GB"),
              status: (
                <FinanceStatusChip label={invoice.status} tone={invoice.status} />
              ),
              actions: (
                <div className="flex flex-wrap justify-end gap-1">
                  {invoice.status === "draft" ? (
                    <>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void runAction(invoice.id, "send")}
                      >
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void runAction(invoice.id, "delete")}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                  {invoice.status === "sent" || invoice.status === "overdue" ? (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void runAction(invoice.id, "pay")}
                    >
                      Record payment
                    </Button>
                  ) : null}
                </div>
              ),
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HrPageHeader } from "@/components/hr/hr-nav";
import { HrDataTable, HrPanel, HrStatusChip } from "@/components/hr/hr-ui";
import type { HrDocument, HrEmployee } from "@/types/platform-modules";

export function HrInvoicesClient({
  initialInvoices,
  employees,
}: {
  initialInvoices: HrDocument[];
  employees: HrEmployee[];
}) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [subjectName, setSubjectName] = useState(employees[0]?.name ?? "");
  const [amount, setAmount] = useState("1500");
  const [description, setDescription] = useState("Contractor services");
  const [busy, setBusy] = useState(false);

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/hr/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "corporate_invoice",
          title: `Invoice — ${subjectName}`,
          subjectName,
          subjectKind: "employee",
          instructions: `Create a corporate invoice for ${description}, amount GBP ${amount}.`,
          contextFields: {
            amountGbp: amount,
            description,
          },
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { document?: HrDocument; documents?: HrDocument[] };
      const doc = data.document ?? data.documents?.[0];
      if (doc) setInvoices((prev) => [doc, ...prev]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Invoices"
        description="Corporate and contractor invoices from the HR document engine."
      />
      <HrPanel title="Create invoice">
        <form onSubmit={createInvoice} className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            list="hr-invoice-subjects"
            placeholder="Bill to / subject"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
          />
          <datalist id="hr-invoice-subjects">
            {employees.map((e) => (
              <option key={e.id} value={e.name} />
            ))}
          </datalist>
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Amount GBP"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold sm:col-span-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy} className="w-fit">
            Generate invoice
          </Button>
        </form>
      </HrPanel>
      <HrDataTable
        columns={[
          { key: "title", label: "Invoice" },
          { key: "subject", label: "Subject" },
          { key: "status", label: "Status" },
        ]}
        rows={invoices.map((d) => ({
          id: d.id,
          cells: {
            title: d.title,
            subject: d.subjectName,
            status: (
              <HrStatusChip
                label={d.status}
                tone={d.status === "finalized" ? "completed" : "pending"}
              />
            ),
          },
        }))}
        empty="No invoices yet."
      />
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FinanceField, FinanceSelect } from "@/components/finance/finance-ui";
import { EXPENSE_CATEGORIES } from "@/lib/finance/accounts";

function dueInDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function apiMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { message?: string } | string }).error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  }
  return fallback;
}

const labelClass = "block text-xs font-semibold text-foreground";

export function FinanceInvoiceCreateForm({
  customerNames = [],
  onCreated,
}: {
  customerNames?: string[];
  onCreated?: () => void | Promise<void>;
}) {
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(dueInDays(14));
  const [description, setDescription] = useState("");
  const [vatIncluded, setVatIncluded] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          amount: Number(amount),
          dueDate,
          description: description || undefined,
          vatIncluded,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(apiMessage(data, "Could not create invoice"));
        return;
      }
      setClientName("");
      setAmount("");
      setDescription("");
      setDueDate(dueInDays(14));
      setMessage("Draft saved. Open Invoices to send it or record payment.");
      await onCreated?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className={labelClass}>
        Customer
        <FinanceField
          className="mt-1 w-full"
          placeholder="e.g. Acme Ltd"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          list="finance-create-customers"
        />
      </label>
      <datalist id="finance-create-customers">
        {[...new Set(customerNames)].map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <label className={labelClass}>
        Amount (£)
        <FinanceField
          className="mt-1 w-full"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="1200.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>
      <label className={labelClass}>
        Due date
        <FinanceField
          className="mt-1 w-full"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </label>
      <label className={labelClass}>
        What is this for?
        <FinanceField
          className="mt-1 w-full"
          placeholder="Website build, retainer, support…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="flex items-end gap-2 pb-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={vatIncluded}
          onChange={(e) => setVatIncluded(e.target.checked)}
        />
        Amount includes 20% VAT
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save draft invoice"}
        </Button>
        {error ? <p className="text-sm text-[color:var(--finance-loss)]">{error}</p> : null}
        {message ? (
          <p className="text-sm text-[color:var(--finance-profit)]">{message}</p>
        ) : null}
      </div>
    </form>
  );
}

export function FinanceExpenseCreateForm({
  onCreated,
}: {
  onCreated?: () => void | Promise<void>;
}) {
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]?.id ?? "operating");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const [vatIncluded, setVatIncluded] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          category,
          amount: Number(amount),
          date,
          notes: notes || undefined,
          vatIncluded,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(apiMessage(data, "Could not record expense"));
        return;
      }
      setVendor("");
      setAmount("");
      setNotes("");
      setDate(todayIsoDate());
      setMessage("Expense recorded and posted to the books.");
      await onCreated?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className={labelClass}>
        Paid to
        <FinanceField
          className="mt-1 w-full"
          placeholder="e.g. AWS"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          required
        />
      </label>
      <label className={labelClass}>
        Category
        <FinanceSelect
          className="mt-1 w-full"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          {EXPENSE_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </FinanceSelect>
      </label>
      <label className={labelClass}>
        Amount (£)
        <FinanceField
          className="mt-1 w-full"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="240.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>
      <label className={labelClass}>
        Date paid
        <FinanceField
          className="mt-1 w-full"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Notes
        <FinanceField
          className="mt-1 w-full"
          placeholder="Optional"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
        <input
          type="checkbox"
          checked={vatIncluded}
          onChange={(e) => setVatIncluded(e.target.checked)}
        />
        Amount includes 20% VAT
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Record expense"}
        </Button>
        {error ? <p className="text-sm text-[color:var(--finance-loss)]">{error}</p> : null}
        {message ? (
          <p className="text-sm text-[color:var(--finance-profit)]">{message}</p>
        ) : null}
      </div>
    </form>
  );
}

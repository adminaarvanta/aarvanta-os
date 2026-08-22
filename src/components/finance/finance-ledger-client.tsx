"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinanceField,
  FinancePanel,
  FinanceSelect,
  FinanceStatusChip,
} from "@/components/finance/finance-ui";
import { formatFinanceCurrency, todayIsoDate } from "@/lib/finance/format";
import type { ChartOfAccount } from "@/types/platform-modules";
import type { JournalEntry } from "@/types/finance-ledger";

function apiMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { message?: string } | string }).error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  }
  return fallback;
}

export function FinanceLedgerClient({
  initialEntries,
  accounts,
}: {
  initialEntries: JournalEntry[];
  accounts: ChartOfAccount[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [date, setDate] = useState(todayIsoDate());
  const [description, setDescription] = useState("");
  const [debitAccount, setDebitAccount] = useState(accounts[0]?.code ?? "4100");
  const [creditAccount, setCreditAccount] = useState(accounts[1]?.code ?? "1000");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.active),
    [accounts]
  );

  async function refresh() {
    const res = await fetch("/api/finance/ledger");
    if (res.ok) {
      const data = (await res.json()) as { entries: JournalEntry[] };
      setEntries(
        [...data.entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      );
    }
    router.refresh();
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function postEntry(e: FormEvent) {
    e.preventDefault();
    if (debitAccount === creditAccount) {
      setMessage("Pick two different accounts.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const value = Number(amount);
      const res = await fetch("/api/finance/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description,
          lines: [
            { accountCode: debitAccount, debit: value, credit: 0 },
            { accountCode: creditAccount, debit: 0, credit: value },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(apiMessage(data, "Could not post journal"));
        return;
      }
      setDescription("");
      setAmount("");
      setMessage("Journal posted.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FinancePageHeader
        title="Ledger"
        description="Every invoice, payment, and expense lands here as a balanced journal. Use a manual entry only for transfers or corrections."
      />
      {message ? (
        <p className="text-sm text-[color:var(--finance-profit)]">{message}</p>
      ) : null}

      <FinancePanel
        title="Manual journal"
        description="Debit one account and credit another for the same amount."
      >
        <form onSubmit={postEntry} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FinanceField
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <FinanceSelect
            value={debitAccount}
            onChange={(e) => setDebitAccount(e.target.value)}
            required
          >
            {activeAccounts.map((account) => (
              <option key={account.code} value={account.code}>
                Debit {account.code} {account.name}
              </option>
            ))}
          </FinanceSelect>
          <FinanceSelect
            value={creditAccount}
            onChange={(e) => setCreditAccount(e.target.value)}
            required
          >
            {activeAccounts.map((account) => (
              <option key={account.code} value={account.code}>
                Credit {account.code} {account.name}
              </option>
            ))}
          </FinanceSelect>
          <FinanceField
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <FinanceField
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={busy}>
              {busy ? "Posting…" : "Post journal"}
            </Button>
          </div>
        </form>
      </FinancePanel>

      <FinancePanel title="Journal entries" description={`${entries.length} posted`}>
        <FinanceDataTable
          empty="No journal entries yet. Send an invoice or record an expense."
          columns={[
            { key: "date", label: "Date" },
            { key: "reference", label: "Reference" },
            { key: "description", label: "Description" },
            { key: "lines", label: "Lines" },
            { key: "source", label: "Source" },
            { key: "status", label: "Status" },
          ]}
          rows={entries.map((entry) => ({
            id: entry.id,
            cells: {
              date: entry.date,
              reference: entry.reference,
              description: entry.description,
              lines: (
                <ul className="space-y-0.5 text-xs text-muted">
                  {entry.lines.map((line, index) => (
                    <li key={`${entry.id}-${index}`}>
                      {line.accountCode} {line.accountName ?? ""} · Dr{" "}
                      {formatFinanceCurrency(line.debit)} / Cr{" "}
                      {formatFinanceCurrency(line.credit)}
                    </li>
                  ))}
                </ul>
              ),
              source: entry.source,
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

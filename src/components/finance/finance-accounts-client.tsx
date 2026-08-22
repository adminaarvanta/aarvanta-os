"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import type { ChartOfAccount } from "@/types/platform-modules";

function apiMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { message?: string } | string }).error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  }
  return fallback;
}

export function FinanceAccountsClient({
  initialAccounts,
}: {
  initialAccounts: ChartOfAccount[];
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<ChartOfAccount["type"]>("expense");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/finance/accounts");
    if (res.ok) {
      const data = (await res.json()) as { accounts: ChartOfAccount[] };
      setAccounts(data.accounts);
    }
    router.refresh();
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/finance/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(apiMessage(data, "Could not add account"));
        return;
      }
      setCode("");
      setName("");
      setMessage("Account added.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FinancePageHeader
        title="Chart of accounts"
        description="The UK starter chart is provisioned automatically. Add extra accounts only when you need a new category."
      />
      {message ? (
        <p className="text-sm text-[color:var(--finance-profit)]">{message}</p>
      ) : null}

      <FinancePanel title="Add account">
        <form onSubmit={createAccount} className="grid gap-3 sm:grid-cols-4">
          <FinanceField
            placeholder="Code (e.g. 3300)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <FinanceField
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FinanceSelect
            value={type}
            onChange={(e) => setType(e.target.value as ChartOfAccount["type"])}
          >
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
          </FinanceSelect>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add account"}
          </Button>
        </form>
      </FinancePanel>

      <FinancePanel title="Accounts" description={`${accounts.length} codes`}>
        <FinanceDataTable
          empty="No chart of accounts yet."
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

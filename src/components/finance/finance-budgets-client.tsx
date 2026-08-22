"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinanceField,
  FinancePanel,
} from "@/components/finance/finance-ui";
import { EXPENSE_CATEGORIES } from "@/lib/finance/accounts";
import { formatFinanceCurrency } from "@/lib/finance/format";
import type { FinanceBudget } from "@/types/platform-modules";

function apiMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { message?: string } | string }).error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  }
  return fallback;
}

export function FinanceBudgetsClient({
  initialBudgets,
}: {
  initialBudgets: FinanceBudget[];
}) {
  const router = useRouter();
  const [budgets, setBudgets] = useState(initialBudgets);
  const [department, setDepartment] = useState(EXPENSE_CATEGORIES[0]?.id ?? "operating");
  const [allocated, setAllocated] = useState("");
  const [period, setPeriod] = useState(new Date().getFullYear().toString());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/finance/budgets");
    if (res.ok) {
      const data = (await res.json()) as { budgets: FinanceBudget[] };
      setBudgets(data.budgets);
    }
    router.refresh();
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createBudget(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department,
          allocated: Number(allocated),
          period,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(apiMessage(data, "Could not create budget"));
        return;
      }
      setAllocated("");
      setMessage("Budget added. Matching expenses will increase spent.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FinancePageHeader
        title="Budgets"
        description="Set a spend cap per category. Recording an expense with the same category increases spent."
      />
      {message ? (
        <p className="text-sm text-[color:var(--finance-profit)]">{message}</p>
      ) : null}

      <FinancePanel title="New budget">
        <form onSubmit={createBudget} className="grid gap-3 sm:grid-cols-4">
          <FinanceField
            placeholder="Category / department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            list="budget-categories"
            required
          />
          <datalist id="budget-categories">
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </datalist>
          <FinanceField
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Allocated"
            value={allocated}
            onChange={(e) => setAllocated(e.target.value)}
            required
          />
          <FinanceField
            placeholder="Period (e.g. 2026)"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Create budget"}
          </Button>
        </form>
      </FinancePanel>

      <FinancePanel title="Budget lines" description={`${budgets.length} categories`}>
        <FinanceDataTable
          empty="No budgets yet."
          columns={[
            { key: "department", label: "Category" },
            { key: "period", label: "Period" },
            { key: "allocated", label: "Allocated", className: "text-right" },
            { key: "spent", label: "Spent", className: "text-right" },
            { key: "remaining", label: "Remaining", className: "text-right" },
            { key: "utilized", label: "Used" },
          ]}
          rows={budgets.map((budget) => {
            const used = Math.round((budget.spent / Math.max(budget.allocated, 1)) * 100);
            return {
              id: budget.id,
              cells: {
                department: budget.department,
                period: budget.period,
                allocated: formatFinanceCurrency(budget.allocated, budget.currency),
                spent: formatFinanceCurrency(budget.spent, budget.currency),
                remaining: formatFinanceCurrency(
                  budget.allocated - budget.spent,
                  budget.currency
                ),
                utilized: (
                  <div className="min-w-[120px]">
                    <div className="mb-1 text-xs text-muted">{used}%</div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-[color:var(--finance-accent)]"
                        style={{ width: `${Math.min(used, 100)}%` }}
                      />
                    </div>
                  </div>
                ),
              },
            };
          })}
        />
      </FinancePanel>
    </div>
  );
}

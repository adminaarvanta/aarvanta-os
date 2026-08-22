"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FinanceExpenseCreateForm } from "@/components/finance/finance-create-forms";
import { FinancePageHeader } from "@/components/finance/finance-nav";
import { FinanceDataTable, FinancePanel } from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import type { FinanceExpense } from "@/types/platform-modules";

export function FinanceExpensesClient({
  initialExpenses,
}: {
  initialExpenses: FinanceExpense[];
}) {
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);

  async function refresh() {
    const res = await fetch("/api/finance/expenses");
    if (res.ok) {
      const data = (await res.json()) as { expenses: FinanceExpense[] };
      setExpenses(data.expenses);
    }
    router.refresh();
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-5">
      <FinancePageHeader
        title="Expenses"
        description="Type a vendor and amount to log spend. It reduces cash and updates profit & loss."
      />

      <FinancePanel
        title="Record expense"
        description="Use the category that matches how you want it to appear on profit & loss."
      >
        <FinanceExpenseCreateForm onCreated={refresh} />
      </FinancePanel>

      <FinancePanel
        title="Expense register"
        description={`${expenses.length} records · ${formatFinanceCurrency(total)} spent`}
      >
        <FinanceDataTable
          empty="No expenses yet. Record one above."
          columns={[
            { key: "vendor", label: "Vendor" },
            { key: "category", label: "Category" },
            { key: "notes", label: "Notes" },
            { key: "amount", label: "Amount", className: "text-right" },
            { key: "date", label: "Date" },
          ]}
          rows={expenses.map((expense) => ({
            id: expense.id,
            cells: {
              vendor: expense.vendor,
              category: expense.category,
              notes: expense.notes || "—",
              amount: formatFinanceCurrency(expense.amount, expense.currency),
              date: new Date(expense.date).toLocaleDateString("en-GB"),
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

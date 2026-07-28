import { FinancePageHeader } from "@/components/finance/finance-nav";
import { FinanceDataTable, FinancePanel } from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceExpensesPage() {
  const scope = await getTenantScope();
  const expenses = await getFinanceStore().listExpenses(scope);

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Expenses"
        description="Vendor spend by category for cashflow and P&L."
      />
      <FinancePanel title="Expense register" description={`${expenses.length} records`}>
        <FinanceDataTable
          empty="No expenses yet."
          columns={[
            { key: "vendor", label: "Vendor" },
            { key: "category", label: "Category" },
            { key: "amount", label: "Amount", className: "text-right" },
            { key: "date", label: "Date" },
          ]}
          rows={expenses.map((expense) => ({
            id: expense.id,
            cells: {
              vendor: expense.vendor,
              category: expense.category,
              amount: formatFinanceCurrency(expense.amount, expense.currency),
              date: new Date(expense.date).toLocaleDateString("en-GB"),
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

export const metadata = { title: "Finance · Expenses" };

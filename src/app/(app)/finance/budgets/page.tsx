import { FinancePageHeader } from "@/components/finance/finance-nav";
import { FinanceDataTable, FinancePanel } from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceBudgetsPage() {
  const scope = await getTenantScope();
  const budgets = await getFinanceStore().listBudgets(scope);

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Budgets"
        description="Department allocations versus spend for the period."
      />
      <FinancePanel title="Budget lines" description={`${budgets.length} departments`}>
        <FinanceDataTable
          empty="No budgets yet."
          columns={[
            { key: "department", label: "Department" },
            { key: "period", label: "Period" },
            { key: "allocated", label: "Allocated", className: "text-right" },
            { key: "spent", label: "Spent", className: "text-right" },
            { key: "utilized", label: "Utilized", className: "text-right" },
          ]}
          rows={budgets.map((budget) => ({
            id: budget.id,
            cells: {
              department: budget.department,
              period: budget.period,
              allocated: formatFinanceCurrency(budget.allocated, budget.currency),
              spent: formatFinanceCurrency(budget.spent, budget.currency),
              utilized: `${Math.round((budget.spent / Math.max(budget.allocated, 1)) * 100)}%`,
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

export const metadata = { title: "Finance · Budgets" };

import { Wallet } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function FinancePage() {
  const scope = await getTenantScope();
  const store = getFinanceStore();
  const [invoices, expenses, budgets] = await Promise.all([
    store.list(scope),
    store.listExpenses(scope),
    store.listBudgets(scope),
  ]);

  const invoiceValue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const expenseValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const allocatedBudget = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const spentBudget = budgets.reduce((sum, budget) => sum + budget.spent, 0);

  return (
    <ModulePageShell
      icon={Wallet}
      title="Finance OS"
      description="Track invoices, expenses, and budgets in one operational view."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Invoices", value: invoices.length, sub: formatCurrency(invoiceValue, "GBP") },
            { label: "Expenses", value: expenses.length, sub: formatCurrency(expenseValue, "GBP") },
            {
              label: "Budget allocated",
              value: formatCurrency(allocatedBudget, "GBP"),
              sub: "Across departments",
            },
            {
              label: "Budget spent",
              value: formatCurrency(spentBudget, "GBP"),
              sub: `${allocatedBudget ? Math.round((spentBudget / allocatedBudget) * 100) : 0}%`,
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Invoices</h3>
          <CardList
            items={invoices.map((invoice) => ({
              id: invoice.id,
              title: `${invoice.number} · ${invoice.clientName}`,
              body: formatCurrency(invoice.amount, invoice.currency),
              meta: `Due ${new Date(invoice.dueDate).toLocaleDateString()}`,
              badge: invoice.status,
            }))}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Expenses</h3>
          <CardList
            items={expenses.map((expense) => ({
              id: expense.id,
              title: `${expense.vendor} · ${expense.category}`,
              body: formatCurrency(expense.amount, expense.currency),
              meta: `Date ${new Date(expense.date).toLocaleDateString()}`,
            }))}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Budgets</h3>
          <CardList
            items={budgets.map((budget) => ({
              id: budget.id,
              title: `${budget.department} · ${budget.period}`,
              body: `${formatCurrency(budget.spent, budget.currency)} spent of ${formatCurrency(
                budget.allocated,
                budget.currency
              )}`,
              meta: `${Math.round((budget.spent / budget.allocated) * 100)}% utilized`,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Finance" };

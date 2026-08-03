import { PendingLink } from "@/components/layout/navigation-provider";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { FinancePageHeader } from "@/components/finance/finance-nav";
import { FinancePanel, FinanceStatStrip } from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import {
  buildBalanceSheet,
  buildProfitAndLoss,
} from "@/lib/finance/reports";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceOverviewPage() {
  const scope = await getTenantScope();
  const store = getFinanceStore();
  const [invoices, expenses, budgets, journalEntries, pl, balanceSheet] =
    await Promise.all([
      store.list(scope),
      store.listExpenses(scope),
      store.listBudgets(scope),
      store.listJournalEntries(scope),
      buildProfitAndLoss(scope),
      buildBalanceSheet(scope),
    ]);

  const invoiceValue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const expenseValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").length;
  const allocatedBudget = budgets.reduce((sum, budget) => sum + budget.allocated, 0);

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Money & ledger"
        description="Invoices, expenses, double-entry ledger, and UK reports in one workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            <AskAiButton module="finance" />
            <PendingLink
              href="/finance/invoices"
              className="inline-flex items-center justify-center rounded-lg bg-[color:var(--finance-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              View invoices
            </PendingLink>
            <PendingLink
              href="/finance/reports"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-[color:var(--finance-accent)]/40 hover:bg-surface-hover"
            >
              Reports
            </PendingLink>
          </div>
        }
      />

      <FinanceStatStrip
        items={[
          {
            label: "Invoices",
            value: invoices.length,
            hint: formatFinanceCurrency(invoiceValue),
            tone: "sky",
          },
          {
            label: "Expenses",
            value: expenses.length,
            hint: formatFinanceCurrency(expenseValue),
            tone: "amber",
          },
          {
            label: "Net profit",
            value: formatFinanceCurrency(pl.netProfit, pl.currency),
            hint: `Revenue ${formatFinanceCurrency(pl.revenue, pl.currency)}`,
            tone: pl.netProfit >= 0 ? "emerald" : "rose",
          },
          {
            label: "Journal entries",
            value: journalEntries.length,
            hint: "Double-entry ledger",
            tone: "indigo",
          },
          {
            label: "Budgets",
            value: formatFinanceCurrency(allocatedBudget),
            hint: `${overdue} overdue invoices`,
            tone: "teal",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancePanel
          title="Today’s focus"
          description="Jump into the module that needs attention."
        >
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Collect receivables</span>
              <PendingLink
                href="/finance/invoices"
                className="font-medium text-[color:var(--finance-accent)] hover:underline"
              >
                Invoices →
              </PendingLink>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Review spend</span>
              <PendingLink
                href="/finance/expenses"
                className="font-medium text-[color:var(--finance-accent)] hover:underline"
              >
                Expenses →
              </PendingLink>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Close the books</span>
              <PendingLink
                href="/finance/reports"
                className="font-medium text-[color:var(--finance-accent)] hover:underline"
              >
                P&amp;L / BS →
              </PendingLink>
            </li>
          </ul>
        </FinancePanel>
        <FinancePanel
          title="Balance snapshot"
          description={`As of ${balanceSheet.asOf}`}
        >
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Assets</span>
              <span className="font-medium text-foreground">
                {formatFinanceCurrency(balanceSheet.assets, balanceSheet.currency)}
              </span>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Liabilities</span>
              <span className="font-medium text-foreground">
                {formatFinanceCurrency(
                  balanceSheet.liabilities,
                  balanceSheet.currency
                )}
              </span>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Equity</span>
              <span className="font-medium text-foreground">
                {formatFinanceCurrency(balanceSheet.equity, balanceSheet.currency)}
              </span>
            </li>
          </ul>
        </FinancePanel>
      </div>
    </div>
  );
}

export const metadata = { title: "Finance" };

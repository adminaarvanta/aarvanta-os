import { Wallet } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getFinanceStore } from "@/lib/data/platform-store";
import {
  buildBalanceSheet,
  buildProfitAndLoss,
  buildTrialBalance,
} from "@/lib/finance/reports";
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
  const [invoices, expenses, budgets, chartOfAccounts, journalEntries, trialBalance, pl, balanceSheet] =
    await Promise.all([
    store.list(scope),
    store.listExpenses(scope),
    store.listBudgets(scope),
    store.listChartOfAccounts(scope),
    store.listJournalEntries(scope),
    buildTrialBalance(scope),
    buildProfitAndLoss(scope),
    buildBalanceSheet(scope),
  ]);

  const invoiceValue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const expenseValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const allocatedBudget = budgets.reduce((sum, budget) => sum + budget.allocated, 0);

  return (
    <ModulePageShell
      icon={Wallet}
      title="Finance OS"
      description="Track invoices, expenses, budgets, journal ledger, and financial reports."
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
              label: "Net profit (YTD)",
              value: formatCurrency(pl.netProfit, "GBP"),
              sub: `Revenue ${formatCurrency(pl.revenue, "GBP")}`,
            },
            {
              label: "Journal entries",
              value: journalEntries.length,
              sub: "Double-entry ledger",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Invoices</h3>
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
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Expenses</h3>
          <CardList
            items={expenses.map((expense) => ({
              id: expense.id,
              title: `${expense.vendor} · ${expense.category}`,
              body: formatCurrency(expense.amount, expense.currency),
              meta: `Date ${new Date(expense.date).toLocaleDateString()}`,
            }))}
          />
        </section>

        {journalEntries.length > 0 ? (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Journal ledger</h3>
            <CardList
              items={journalEntries.map((entry) => ({
                id: entry.id,
                title: `${entry.reference} · ${entry.description}`,
                body: `${entry.lines.length} lines`,
                meta: entry.date,
                badge: entry.status,
              }))}
            />
          </section>
        ) : null}

        {trialBalance.length > 0 ? (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Trial balance</h3>
            <CardList
              items={trialBalance.map((row) => ({
                id: row.accountCode,
                title: `${row.accountCode} · ${row.accountName}`,
                body: formatCurrency(row.balance, "GBP"),
                meta: `Dr ${formatCurrency(row.debit, "GBP")} · Cr ${formatCurrency(row.credit, "GBP")}`,
                badge: row.type,
              }))}
            />
          </section>
        ) : null}

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Profit &amp; loss</h3>
          <CardList
            items={[
              {
                id: "pl-revenue",
                title: "Revenue",
                body: formatCurrency(pl.revenue, pl.currency),
              },
              {
                id: "pl-cogs",
                title: "Cost of sales",
                body: formatCurrency(pl.cogs, pl.currency),
              },
              {
                id: "pl-opex",
                title: "Operating expenses",
                body: formatCurrency(pl.operatingExpenses, pl.currency),
              },
              {
                id: "pl-net",
                title: "Net profit",
                body: formatCurrency(pl.netProfit, pl.currency),
                badge: pl.netProfit >= 0 ? "profit" : "loss",
              },
            ]}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Balance sheet</h3>
          <CardList
            items={[
              {
                id: "bs-assets",
                title: "Total assets",
                body: formatCurrency(balanceSheet.assets, balanceSheet.currency),
              },
              {
                id: "bs-liabilities",
                title: "Total liabilities",
                body: formatCurrency(balanceSheet.liabilities, balanceSheet.currency),
              },
              {
                id: "bs-equity",
                title: "Total equity",
                body: formatCurrency(balanceSheet.equity, balanceSheet.currency),
                meta: `As of ${balanceSheet.asOf}`,
              },
            ]}
          />
        </section>

        {chartOfAccounts.length > 0 ? (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">
              Chart of accounts (UK)
            </h3>
            <CardList
              items={chartOfAccounts.map((account) => ({
                id: account.id,
                title: `${account.code} · ${account.name}`,
                body: account.type,
                meta: account.vatApplicable ? "VAT applicable" : "No VAT",
                badge: account.active ? "active" : "inactive",
              }))}
            />
          </section>
        ) : null}

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Budgets</h3>
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

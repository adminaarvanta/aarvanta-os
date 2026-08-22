"use client";

import { useEffect, useMemo, useState } from "react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import {
  FinanceExpenseCreateForm,
  FinanceInvoiceCreateForm,
} from "@/components/finance/finance-create-forms";
import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinancePanel,
  FinanceStatStrip,
  FinanceStatusChip,
} from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import type { FinanceExpense, FinanceInvoice } from "@/types/platform-modules";
import type {
  BalanceSheetReport,
  CashSummaryReport,
  ProfitAndLossReport,
} from "@/types/finance-ledger";

type ReportsPayload = {
  profitAndLoss: ProfitAndLossReport;
  balanceSheet: BalanceSheetReport;
  cash: CashSummaryReport;
};

export function FinanceOverviewClient({
  initialInvoices,
  initialExpenses,
  initialPl,
  initialBalanceSheet,
  initialCash,
}: {
  initialInvoices: FinanceInvoice[];
  initialExpenses: FinanceExpense[];
  initialPl: ProfitAndLossReport;
  initialBalanceSheet: BalanceSheetReport;
  initialCash: CashSummaryReport;
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [pl, setPl] = useState(initialPl);
  const [balanceSheet, setBalanceSheet] = useState(initialBalanceSheet);
  const [cash, setCash] = useState(initialCash);

  async function reload() {
    const [financeRes, reportsRes] = await Promise.all([
      fetch("/api/finance"),
      fetch("/api/finance/reports"),
    ]);
    if (financeRes.ok) {
      const data = (await financeRes.json()) as {
        invoices: FinanceInvoice[];
        expenses: FinanceExpense[];
      };
      setInvoices(data.invoices);
      setExpenses(data.expenses);
    }
    if (reportsRes.ok) {
      const data = (await reportsRes.json()) as ReportsPayload;
      setPl(data.profitAndLoss);
      setBalanceSheet(data.balanceSheet);
      setCash(data.cash);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const unpaid = useMemo(
    () => invoices.filter((invoice) => invoice.status === "sent" || invoice.status === "overdue"),
    [invoices]
  );
  const overdue = invoices.filter((invoice) => invoice.status === "overdue");
  const toCollect = unpaid.reduce((sum, invoice) => sum + invoice.amount, 0);
  const spend = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Money in and out"
        description="Type an invoice or expense below. Reports and the ledger update from those entries."
        actions={
          <div className="flex flex-wrap gap-2">
            <AskAiButton module="finance" />
            <PendingLink
              href="/finance/invoices"
              className="inline-flex items-center justify-center rounded-lg bg-[color:var(--finance-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              New invoice
            </PendingLink>
            <PendingLink
              href="/finance/expenses"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-[color:var(--finance-accent)]/40 hover:bg-surface-hover"
            >
              Record expense
            </PendingLink>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancePanel
          title="Create an invoice"
          description="Type the customer and amount, then save a draft. Send it later from Invoices."
        >
          <FinanceInvoiceCreateForm
            customerNames={invoices.map((invoice) => invoice.clientName)}
            onCreated={reload}
          />
        </FinancePanel>
        <FinancePanel
          title="Record an expense"
          description="Log money you already paid. It hits cash and profit & loss immediately."
        >
          <FinanceExpenseCreateForm onCreated={reload} />
        </FinancePanel>
      </div>

      <FinanceStatStrip
        items={[
          {
            label: "Profit",
            value: formatFinanceCurrency(pl.netProfit, pl.currency),
            hint: `Income ${formatFinanceCurrency(pl.revenue, pl.currency)}`,
            tone: pl.netProfit >= 0 ? "emerald" : "rose",
          },
          {
            label: "To collect",
            value: formatFinanceCurrency(toCollect),
            hint: `${unpaid.length} open invoices`,
            tone: "sky",
          },
          {
            label: "Overdue",
            value: overdue.length,
            hint: overdue.length ? "Follow up now" : "None overdue",
            tone: overdue.length ? "rose" : "emerald",
          },
          {
            label: "Cash",
            value: formatFinanceCurrency(cash.cashOnHand, cash.currency),
            hint: `In ${formatFinanceCurrency(cash.cashIn)} · out ${formatFinanceCurrency(cash.cashOut)}`,
            tone: "teal",
          },
          {
            label: "Expenses",
            value: formatFinanceCurrency(spend),
            hint: `${expenses.length} recorded`,
            tone: "amber",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancePanel
          title="Open invoices"
          description="Send drafts, then record payment when the money arrives."
          actions={
            <PendingLink
              href="/finance/invoices"
              className="text-sm font-medium text-[color:var(--finance-accent)] hover:underline"
            >
              All invoices →
            </PendingLink>
          }
        >
          <FinanceDataTable
            empty="Nothing to collect."
            columns={[
              { key: "client", label: "Customer" },
              { key: "amount", label: "Amount", className: "text-right" },
              { key: "status", label: "Status" },
            ]}
            rows={unpaid.slice(0, 6).map((invoice) => ({
              id: invoice.id,
              cells: {
                client: invoice.clientName,
                amount: formatFinanceCurrency(invoice.amount, invoice.currency),
                status: (
                  <FinanceStatusChip label={invoice.status} tone={invoice.status} />
                ),
              },
            }))}
          />
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
                {formatFinanceCurrency(balanceSheet.liabilities, balanceSheet.currency)}
              </span>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Equity</span>
              <span className="font-medium text-foreground">
                {formatFinanceCurrency(balanceSheet.equity, balanceSheet.currency)}
              </span>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Expenses recorded</span>
              <span className="font-medium text-foreground">
                {formatFinanceCurrency(spend)}
              </span>
            </li>
          </ul>
        </FinancePanel>
      </div>
    </div>
  );
}

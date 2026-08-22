"use client";

import { useEffect, useMemo, useState } from "react";
import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinancePanel,
  FinanceStatusChip,
} from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import type { FinanceInvoice } from "@/types/platform-modules";
import type {
  BalanceSheetReport,
  CashSummaryReport,
  ProfitAndLossReport,
  TrialBalanceRow,
} from "@/types/finance-ledger";

type ReportsPayload = {
  trialBalance: TrialBalanceRow[];
  profitAndLoss: ProfitAndLossReport;
  balanceSheet: BalanceSheetReport;
  cash: CashSummaryReport;
};

export function FinanceReportsClient({
  initial,
  invoices,
}: {
  initial: ReportsPayload;
  invoices: FinanceInvoice[];
}) {
  const [reports, setReports] = useState(initial);
  const [openInvoices, setOpenInvoices] = useState(invoices);

  useEffect(() => {
    async function load() {
      const [reportsRes, invoicesRes] = await Promise.all([
        fetch("/api/finance/reports"),
        fetch("/api/finance/invoices"),
      ]);
      if (reportsRes.ok) {
        setReports((await reportsRes.json()) as ReportsPayload);
      }
      if (invoicesRes.ok) {
        const data = (await invoicesRes.json()) as { invoices: FinanceInvoice[] };
        setOpenInvoices(data.invoices);
      }
    }
    void load();
  }, []);

  const aged = useMemo(() => {
    const unpaid = openInvoices.filter(
      (invoice) => invoice.status === "sent" || invoice.status === "overdue"
    );
    const current = unpaid.filter((invoice) => invoice.status === "sent");
    const overdue = unpaid.filter((invoice) => invoice.status === "overdue");
    return {
      current: current.reduce((sum, invoice) => sum + invoice.amount, 0),
      overdue: overdue.reduce((sum, invoice) => sum + invoice.amount, 0),
      rows: unpaid,
    };
  }, [openInvoices]);

  const { profitAndLoss: pl, balanceSheet, trialBalance, cash } = reports;
  const currency = pl.currency;

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Reports"
        description="Profit & loss, balance sheet, cash, aged receivables, and trial balance."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancePanel title="Profit & loss" description={`Period ${pl.period}`}>
          <FinanceDataTable
            empty="No income or spend posted yet."
            columns={[
              { key: "line", label: "Account" },
              { key: "amount", label: "Amount", className: "text-right" },
            ]}
            rows={[
              ...pl.lines.map((line) => ({
                id: `pl-${line.code}`,
                cells: {
                  line: `${line.code} ${line.name}`,
                  amount: formatFinanceCurrency(line.amount, currency),
                },
              })),
              {
                id: "pl-net",
                cells: {
                  line: (
                    <span className="inline-flex items-center gap-2 font-semibold">
                      Net profit
                      <FinanceStatusChip
                        label={pl.netProfit >= 0 ? "profit" : "loss"}
                        tone={pl.netProfit >= 0 ? "profit" : "loss"}
                      />
                    </span>
                  ),
                  amount: (
                    <span className="font-semibold">
                      {formatFinanceCurrency(pl.netProfit, currency)}
                    </span>
                  ),
                },
              },
            ]}
          />
        </FinancePanel>

        <FinancePanel title="Balance sheet" description={`As of ${balanceSheet.asOf}`}>
          <FinanceDataTable
            empty="No balance-sheet activity yet."
            columns={[
              { key: "line", label: "Account" },
              { key: "amount", label: "Amount", className: "text-right" },
            ]}
            rows={[
              ...balanceSheet.lines.map((line) => ({
                id: `bs-${line.code}`,
                cells: {
                  line: (
                    <span>
                      {line.code} {line.name}{" "}
                      <FinanceStatusChip
                        label={line.type}
                        tone={
                          line.type as
                            | "asset"
                            | "liability"
                            | "equity"
                            | "revenue"
                            | "expense"
                        }
                      />
                    </span>
                  ),
                  amount: formatFinanceCurrency(line.amount, balanceSheet.currency),
                },
              })),
              {
                id: "bs-check",
                cells: {
                  line: <span className="font-semibold">Assets − liabilities</span>,
                  amount: (
                    <span className="font-semibold">
                      {formatFinanceCurrency(
                        balanceSheet.assets - balanceSheet.liabilities,
                        balanceSheet.currency
                      )}
                    </span>
                  ),
                },
              },
            ]}
          />
        </FinancePanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancePanel title="Cash" description={`Bank current account · ${cash.asOf}`}>
          <FinanceDataTable
            columns={[
              { key: "line", label: "Line" },
              { key: "amount", label: "Amount", className: "text-right" },
            ]}
            rows={[
              {
                id: "cash-in",
                cells: {
                  line: "Money in",
                  amount: formatFinanceCurrency(cash.cashIn, cash.currency),
                },
              },
              {
                id: "cash-out",
                cells: {
                  line: "Money out",
                  amount: formatFinanceCurrency(cash.cashOut, cash.currency),
                },
              },
              {
                id: "cash-hand",
                cells: {
                  line: <span className="font-semibold">Cash on hand</span>,
                  amount: (
                    <span className="font-semibold">
                      {formatFinanceCurrency(cash.cashOnHand, cash.currency)}
                    </span>
                  ),
                },
              },
            ]}
          />
        </FinancePanel>

        <FinancePanel title="Who owes you" description="Unpaid and overdue invoices">
          <FinanceDataTable
            empty="No open invoices."
            columns={[
              { key: "client", label: "Customer" },
              { key: "bucket", label: "Age" },
              { key: "amount", label: "Amount", className: "text-right" },
            ]}
            rows={[
              {
                id: "aged-current",
                cells: {
                  client: "Current (not due)",
                  bucket: "Open",
                  amount: formatFinanceCurrency(aged.current),
                },
              },
              {
                id: "aged-overdue",
                cells: {
                  client: "Overdue",
                  bucket: "Past due",
                  amount: formatFinanceCurrency(aged.overdue),
                },
              },
              ...aged.rows.map((invoice) => ({
                id: invoice.id,
                cells: {
                  client: invoice.clientName,
                  bucket: invoice.status === "overdue" ? "Overdue" : "Current",
                  amount: formatFinanceCurrency(invoice.amount, invoice.currency),
                },
              })),
            ]}
          />
        </FinancePanel>
      </div>

      <FinancePanel title="Trial balance" description={`${trialBalance.length} accounts`}>
        <FinanceDataTable
          empty="No trial balance rows yet."
          columns={[
            { key: "code", label: "Code" },
            { key: "name", label: "Account" },
            { key: "debit", label: "Debit", className: "text-right" },
            { key: "credit", label: "Credit", className: "text-right" },
            { key: "balance", label: "Balance", className: "text-right" },
            { key: "type", label: "Type" },
          ]}
          rows={trialBalance.map((row) => ({
            id: row.accountCode,
            cells: {
              code: row.accountCode,
              name: row.accountName,
              debit: formatFinanceCurrency(row.debit),
              credit: formatFinanceCurrency(row.credit),
              balance: formatFinanceCurrency(row.balance),
              type: (
                <FinanceStatusChip
                  label={row.type}
                  tone={
                    row.type as
                      | "asset"
                      | "liability"
                      | "equity"
                      | "revenue"
                      | "expense"
                  }
                />
              ),
            },
          }))}
        />
      </FinancePanel>
    </div>
  );
}

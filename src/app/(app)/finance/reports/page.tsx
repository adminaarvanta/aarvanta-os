import { FinancePageHeader } from "@/components/finance/finance-nav";
import {
  FinanceDataTable,
  FinancePanel,
  FinanceStatusChip,
} from "@/components/finance/finance-ui";
import { formatFinanceCurrency } from "@/lib/finance/format";
import {
  buildBalanceSheet,
  buildProfitAndLoss,
  buildTrialBalance,
} from "@/lib/finance/reports";
import { getTenantScope } from "@/lib/tenant/context";

export default async function FinanceReportsPage() {
  const scope = await getTenantScope();
  const [trialBalance, pl, balanceSheet] = await Promise.all([
    buildTrialBalance(scope),
    buildProfitAndLoss(scope),
    buildBalanceSheet(scope),
  ]);

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Reports"
        description="Trial balance, profit & loss, and balance sheet."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancePanel title="Profit & loss">
          <FinanceDataTable
            columns={[
              { key: "line", label: "Line" },
              { key: "amount", label: "Amount", className: "text-right" },
            ]}
            rows={[
              {
                id: "pl-revenue",
                cells: {
                  line: "Revenue",
                  amount: formatFinanceCurrency(pl.revenue, pl.currency),
                },
              },
              {
                id: "pl-cogs",
                cells: {
                  line: "Cost of sales",
                  amount: formatFinanceCurrency(pl.cogs, pl.currency),
                },
              },
              {
                id: "pl-opex",
                cells: {
                  line: "Operating expenses",
                  amount: formatFinanceCurrency(pl.operatingExpenses, pl.currency),
                },
              },
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
                      {formatFinanceCurrency(pl.netProfit, pl.currency)}
                    </span>
                  ),
                },
              },
            ]}
          />
        </FinancePanel>

        <FinancePanel title="Balance sheet" description={`As of ${balanceSheet.asOf}`}>
          <FinanceDataTable
            columns={[
              { key: "line", label: "Line" },
              { key: "amount", label: "Amount", className: "text-right" },
            ]}
            rows={[
              {
                id: "bs-assets",
                cells: {
                  line: "Total assets",
                  amount: formatFinanceCurrency(
                    balanceSheet.assets,
                    balanceSheet.currency
                  ),
                },
              },
              {
                id: "bs-liabilities",
                cells: {
                  line: "Total liabilities",
                  amount: formatFinanceCurrency(
                    balanceSheet.liabilities,
                    balanceSheet.currency
                  ),
                },
              },
              {
                id: "bs-equity",
                cells: {
                  line: "Total equity",
                  amount: formatFinanceCurrency(
                    balanceSheet.equity,
                    balanceSheet.currency
                  ),
                },
              },
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

export const metadata = { title: "Finance · Reports" };

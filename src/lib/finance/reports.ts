import { getFinanceStore } from "@/lib/data/platform-store";
import type { TenantScope } from "@/types/communication";
import type {
  BalanceSheetReport,
  JournalEntry,
  ProfitAndLossReport,
  TrialBalanceRow,
} from "@/types/finance-ledger";

function sumLines(
  entries: JournalEntry[],
  accountCode: string,
  side: "debit" | "credit"
): number {
  let total = 0;
  for (const entry of entries) {
    if (entry.status !== "posted") continue;
    for (const line of entry.lines) {
      if (line.accountCode === accountCode) {
        total += side === "debit" ? line.debit : line.credit;
      }
    }
  }
  return total;
}

export async function buildTrialBalance(scope: TenantScope): Promise<TrialBalanceRow[]> {
  const finance = getFinanceStore();
  const [accounts, entries] = await Promise.all([
    finance.listChartOfAccounts(scope),
    finance.listJournalEntries(scope),
  ]);

  return accounts
    .filter((a) => a.active)
    .map((account) => {
      const debit = sumLines(entries, account.code, "debit");
      const credit = sumLines(entries, account.code, "credit");
      const balance =
        account.type === "asset" || account.type === "expense"
          ? debit - credit
          : credit - debit;
      return {
        accountCode: account.code,
        accountName: account.name,
        type: account.type,
        debit,
        credit,
        balance,
      };
    })
    .filter((row) => row.debit > 0 || row.credit > 0 || row.balance !== 0);
}

export async function buildProfitAndLoss(scope: TenantScope): Promise<ProfitAndLossReport> {
  const trial = await buildTrialBalance(scope);
  const revenueLines = trial.filter((r) => r.type === "revenue");
  const expenseLines = trial.filter((r) => r.type === "expense");

  const revenue = revenueLines.reduce((s, r) => s + r.balance, 0);
  const cogs = expenseLines
    .filter((r) => r.accountCode.startsWith("2"))
    .reduce((s, r) => s + r.balance, 0);
  const operatingExpenses = expenseLines
    .filter((r) => !r.accountCode.startsWith("2"))
    .reduce((s, r) => s + r.balance, 0);

  return {
    period: new Date().getFullYear().toString(),
    currency: "GBP",
    revenue,
    cogs,
    grossProfit: revenue - cogs,
    operatingExpenses,
    netProfit: revenue - cogs - operatingExpenses,
    lines: [...revenueLines, ...expenseLines].map((r) => ({
      code: r.accountCode,
      name: r.accountName,
      amount: r.balance,
    })),
  };
}

export async function buildBalanceSheet(scope: TenantScope): Promise<BalanceSheetReport> {
  const trial = await buildTrialBalance(scope);
  const assets = trial.filter((r) => r.type === "asset").reduce((s, r) => s + r.balance, 0);
  const liabilities = trial
    .filter((r) => r.type === "liability")
    .reduce((s, r) => s + r.balance, 0);
  const equity = trial.filter((r) => r.type === "equity").reduce((s, r) => s + r.balance, 0);

  return {
    asOf: crmNowDate(),
    currency: "GBP",
    assets,
    liabilities,
    equity,
    lines: trial
      .filter((r) => ["asset", "liability", "equity"].includes(r.type))
      .map((r) => ({
        code: r.accountCode,
        name: r.accountName,
        type: r.type,
        amount: r.balance,
      })),
  };
}

function crmNowDate(): string {
  return new Date().toISOString().slice(0, 10);
}

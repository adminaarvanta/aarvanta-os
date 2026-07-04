import type { TenantScope } from "@/types/communication";

export type JournalLine = {
  accountCode: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
};

export type JournalEntry = TenantScope & {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  source: "manual" | "invoice" | "expense" | "payroll" | "reconciliation";
  sourceId?: string;
  status: "posted" | "draft";
  createdAt: string;
};

export type TrialBalanceRow = {
  accountCode: string;
  accountName: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
};

export type ProfitAndLossReport = {
  period: string;
  currency: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  lines: Array<{ code: string; name: string; amount: number }>;
};

export type BalanceSheetReport = {
  asOf: string;
  currency: string;
  assets: number;
  liabilities: number;
  equity: number;
  lines: Array<{ code: string; name: string; type: string; amount: number }>;
};

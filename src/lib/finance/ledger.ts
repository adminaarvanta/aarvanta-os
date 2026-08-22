import { crmNow } from "@/lib/data/crm-helpers";
import { getFinanceStore } from "@/lib/data/platform-store";
import { FINANCE_ACCOUNTS } from "@/lib/finance/accounts";
import { UK_VAT_STANDARD_RATE } from "@/lib/finance/chart-of-accounts-uk";
import type { TenantScope } from "@/types/communication";
import type { JournalEntry, JournalLine } from "@/types/finance-ledger";

export function splitInclusiveVat(
  gross: number,
  rate = UK_VAT_STANDARD_RATE
): { net: number; vat: number; gross: number } {
  const net = Math.round((gross / (1 + rate)) * 100) / 100;
  const vat = Math.round((gross - net) * 100) / 100;
  return { net, vat, gross };
}

export function validateJournalLines(lines: JournalLine[]): {
  valid: boolean;
  totalDebit: number;
  totalCredit: number;
  message?: string;
} {
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;

  if (lines.length < 2) {
    return { valid: false, totalDebit, totalCredit, message: "At least two lines required." };
  }
  if (roundedDebit !== roundedCredit) {
    return {
      valid: false,
      totalDebit,
      totalCredit,
      message: `Debits (${roundedDebit}) must equal credits (${roundedCredit}).`,
    };
  }
  return { valid: true, totalDebit, totalCredit };
}

export async function findJournalBySource(
  scope: TenantScope,
  source: JournalEntry["source"],
  sourceId: string
): Promise<JournalEntry | null> {
  const entries = await getFinanceStore().listJournalEntries(scope);
  return entries.find((entry) => entry.source === source && entry.sourceId === sourceId) ?? null;
}

export async function postJournalEntry(
  scope: TenantScope,
  input: {
    date: string;
    reference: string;
    description: string;
    lines: JournalLine[];
    source: JournalEntry["source"];
    sourceId?: string;
  }
): Promise<JournalEntry> {
  if (input.sourceId) {
    const existing = await findJournalBySource(scope, input.source, input.sourceId);
    if (existing) return existing;
  }

  const check = validateJournalLines(input.lines);
  if (!check.valid) {
    throw new Error(check.message ?? "Invalid journal entry");
  }

  const accounts = await getFinanceStore().listChartOfAccounts(scope);
  const accountMap = new Map(accounts.map((a) => [a.code, a.name]));

  const lines = input.lines.map((line) => ({
    ...line,
    accountName: line.accountName ?? accountMap.get(line.accountCode) ?? line.accountCode,
  }));

  return getFinanceStore().createJournalEntry({
    ...scope,
    date: input.date,
    reference: input.reference,
    description: input.description,
    lines,
    source: input.source,
    sourceId: input.sourceId,
    status: "posted",
    createdAt: crmNow(),
  });
}

function invoiceDate(invoice: { dueDate?: string; createdAt?: string; paidAt?: string }): string {
  return (invoice.paidAt ?? invoice.createdAt ?? invoice.dueDate ?? crmNow()).slice(0, 10);
}

/** Sale: Dr AR, Cr Sales (and VAT if included). Posted when an invoice is sent. */
export async function postInvoiceToLedger(
  scope: TenantScope,
  invoice: {
    id: string;
    number: string;
    amount: number;
    clientName: string;
    vatIncluded?: boolean;
    createdAt?: string;
    dueDate?: string;
  }
): Promise<JournalEntry> {
  const includeVat = invoice.vatIncluded !== false;
  const { net, vat } = includeVat
    ? splitInclusiveVat(invoice.amount)
    : { net: invoice.amount, vat: 0 };

  const lines: JournalLine[] = [
    {
      accountCode: FINANCE_ACCOUNTS.receivable,
      debit: invoice.amount,
      credit: 0,
      description: "Accounts receivable",
    },
    {
      accountCode: FINANCE_ACCOUNTS.sales,
      debit: 0,
      credit: net,
      description: "Sales",
    },
  ];
  if (vat > 0) {
    lines.push({
      accountCode: FINANCE_ACCOUNTS.vat,
      debit: 0,
      credit: vat,
      description: "VAT on sales",
    });
  }

  return postJournalEntry(scope, {
    date: invoiceDate(invoice),
    reference: invoice.number,
    description: `Invoice ${invoice.number} — ${invoice.clientName}`,
    source: "invoice",
    sourceId: invoice.id,
    lines,
  });
}

/** Payment: Dr Bank, Cr AR. Posted when an invoice is marked paid. */
export async function postInvoicePaymentToLedger(
  scope: TenantScope,
  invoice: {
    id: string;
    number: string;
    amount: number;
    clientName: string;
    paidAt?: string;
    createdAt?: string;
  }
): Promise<JournalEntry> {
  return postJournalEntry(scope, {
    date: invoiceDate(invoice),
    reference: `${invoice.number}-PMT`,
    description: `Payment ${invoice.number} — ${invoice.clientName}`,
    source: "invoice",
    sourceId: `${invoice.id}:payment`,
    lines: [
      {
        accountCode: FINANCE_ACCOUNTS.bank,
        debit: invoice.amount,
        credit: 0,
        description: "Bank",
      },
      {
        accountCode: FINANCE_ACCOUNTS.receivable,
        debit: 0,
        credit: invoice.amount,
        description: "Clear receivable",
      },
    ],
  });
}

/** Expense: Dr spend (+ input VAT), Cr Bank. */
export async function postExpenseToLedger(
  scope: TenantScope,
  expense: {
    id: string;
    vendor: string;
    amount: number;
    accountCode: string;
    date: string;
    vatIncluded?: boolean;
  }
): Promise<JournalEntry> {
  const includeVat = expense.vatIncluded !== false;
  const { net, vat } = includeVat
    ? splitInclusiveVat(expense.amount)
    : { net: expense.amount, vat: 0 };

  const lines: JournalLine[] = [
    {
      accountCode: expense.accountCode,
      debit: net,
      credit: 0,
      description: expense.vendor,
    },
    {
      accountCode: FINANCE_ACCOUNTS.bank,
      debit: 0,
      credit: expense.amount,
      description: "Bank",
    },
  ];
  if (vat > 0) {
    lines.splice(1, 0, {
      accountCode: FINANCE_ACCOUNTS.vat,
      debit: vat,
      credit: 0,
      description: "VAT on purchase",
    });
  }

  return postJournalEntry(scope, {
    date: expense.date.slice(0, 10),
    reference: `EXP-${expense.id.slice(-6).toUpperCase()}`,
    description: `Expense — ${expense.vendor}`,
    source: "expense",
    sourceId: expense.id,
    lines,
  });
}

import { crmNow } from "@/lib/data/crm-helpers";
import { getFinanceStore } from "@/lib/data/platform-store";
import type { TenantScope } from "@/types/communication";
import type { JournalEntry, JournalLine } from "@/types/finance-ledger";

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

export async function postInvoiceToLedger(
  scope: TenantScope,
  invoice: { id: string; number: string; amount: number; clientName: string }
): Promise<JournalEntry> {
  const net = Math.round((invoice.amount / 1.2) * 100) / 100;
  const vat = Math.round((invoice.amount - net) * 100) / 100;

  return postJournalEntry(scope, {
    date: crmNow().slice(0, 10),
    reference: invoice.number,
    description: `Invoice ${invoice.number} — ${invoice.clientName}`,
    source: "invoice",
    sourceId: invoice.id,
    lines: [
      { accountCode: "4100", debit: invoice.amount, credit: 0, description: "AR" },
      { accountCode: "1100", debit: 0, credit: net, description: "Revenue" },
      { accountCode: "5100", debit: 0, credit: vat, description: "VAT liability" },
    ],
  });
}

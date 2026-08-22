import { isDemoMode } from "@/lib/config/app-mode";
import { crmNow } from "@/lib/data/crm-helpers";
import { getFinanceStore } from "@/lib/data/platform-store";
import { accountCodeForExpenseCategory } from "@/lib/finance/accounts";
import { UK_CHART_OF_ACCOUNTS_TEMPLATE } from "@/lib/finance/chart-of-accounts-uk";
import {
  postExpenseToLedger,
  postInvoicePaymentToLedger,
  postInvoiceToLedger,
} from "@/lib/finance/ledger";
import type { TenantScope } from "@/types/communication";

/**
 * Makes the finance module usable: chart of accounts always exists.
 * Demo also posts existing invoices/expenses to the ledger so reports have numbers.
 */
export async function ensureFinanceStack(scope: TenantScope): Promise<void> {
  const finance = getFinanceStore();
  const existing = await finance.listChartOfAccounts(scope);

  if (existing.length === 0) {
    const now = crmNow();
    for (const template of UK_CHART_OF_ACCOUNTS_TEMPLATE) {
      await finance.createChartOfAccount({
        ...scope,
        ...template,
        createdAt: now,
      });
    }
  }

  if (!isDemoMode()) return;

  const [invoices, expenses, journals] = await Promise.all([
    finance.list(scope),
    finance.listExpenses(scope),
    finance.listJournalEntries(scope),
  ]);

  if (journals.length > 0) return;

  for (const invoice of invoices) {
    if (invoice.status === "draft") continue;
    try {
      await postInvoiceToLedger(scope, invoice);
      if (invoice.status === "paid") {
        await postInvoicePaymentToLedger(scope, {
          ...invoice,
          paidAt: invoice.paidAt ?? invoice.createdAt,
        });
      }
    } catch (error) {
      console.warn("[finance] demo invoice ledger seed skipped", error);
    }
  }

  for (const expense of expenses) {
    try {
      await postExpenseToLedger(scope, {
        id: expense.id,
        vendor: expense.vendor,
        amount: expense.amount,
        accountCode: expense.accountCode ?? accountCodeForExpenseCategory(expense.category),
        date: expense.date,
        vatIncluded: expense.vatIncluded,
      });
    } catch (error) {
      console.warn("[finance] demo expense ledger seed skipped", error);
    }
  }
}

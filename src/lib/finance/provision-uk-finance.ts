import { crmNow } from "@/lib/data/crm-helpers";
import { getFinanceStore } from "@/lib/data/platform-store";
import { UK_CHART_OF_ACCOUNTS_TEMPLATE } from "@/lib/finance/chart-of-accounts-uk";
import { calculateUkVat } from "@/lib/rules/packs/finance-uk-v1";
import type { TenantScope } from "@/types/communication";
import type { ChartOfAccount } from "@/types/platform-modules";

export type UkFinanceProvisionResult = {
  accounts: ChartOfAccount[];
  starterInvoiceId?: string;
};

export async function provisionUkFinanceStack(
  scope: TenantScope,
  input: { brandName: string; businessIdea: string }
): Promise<UkFinanceProvisionResult> {
  const finance = getFinanceStore();
  const existing = await finance.listChartOfAccounts(scope);

  let accounts = existing;
  if (existing.length === 0) {
    const now = crmNow();
    accounts = await Promise.all(
      UK_CHART_OF_ACCOUNTS_TEMPLATE.map((template) =>
        finance.createChartOfAccount({
          ...scope,
          ...template,
          createdAt: now,
        })
      )
    );
  }

  const { gross } = calculateUkVat(120);
  const invoice = await finance.create({
    ...scope,
    number: `INV-LAUNCH-${Date.now().toString().slice(-5)}`,
    clientName: "Sample Customer",
    amount: gross,
    currency: "GBP",
    status: "draft",
    dueDate: crmNow().slice(0, 10),
    createdAt: crmNow(),
  });

  const budgets = await finance.listBudgets(scope);
  if (!budgets.some((b) => b.department === "Launch Operations")) {
    await finance.createBudget({
      ...scope,
      department: "Launch Operations",
      allocated: 50_000,
      spent: 0,
      currency: "GBP",
      period: new Date().getFullYear().toString(),
    });
  }

  void input;

  return { accounts, starterInvoiceId: invoice.id };
}

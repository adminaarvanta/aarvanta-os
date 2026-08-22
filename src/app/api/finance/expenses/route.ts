import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, apiError } from "@/lib/api/request";
import { getFinanceStore } from "@/lib/data/platform-store";
import { accountCodeForExpenseCategory } from "@/lib/finance/accounts";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { postExpenseToLedger } from "@/lib/finance/ledger";
import { requirePermission } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await requirePermission("finance:read");
    await ensureFinanceStack(ctx.scope);
    const expenses = await getFinanceStore().listExpenses(ctx.scope);
    return NextResponse.json({
      expenses: [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

const createSchema = z.object({
  vendor: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
  notes: z.string().optional(),
  vatIncluded: z.boolean().optional(),
  currency: z.string().optional(),
  accountCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("finance:write");
    await ensureFinanceStack(ctx.scope);
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const store = getFinanceStore();
    const accountCode =
      parsed.data.accountCode ?? accountCodeForExpenseCategory(parsed.data.category);
    const expense = await store.createExpense({
      ...ctx.scope,
      vendor: parsed.data.vendor.trim(),
      category: parsed.data.category.trim(),
      amount: Math.round(parsed.data.amount * 100) / 100,
      currency: parsed.data.currency ?? "GBP",
      date: parsed.data.date,
      notes: parsed.data.notes?.trim() || undefined,
      vatIncluded: parsed.data.vatIncluded ?? true,
      accountCode,
    });

    await postExpenseToLedger(ctx.scope, {
      id: expense.id,
      vendor: expense.vendor,
      amount: expense.amount,
      accountCode,
      date: expense.date,
      vatIncluded: expense.vatIncluded,
    });

    const budgets = await store.listBudgets(ctx.scope);
    const matched = budgets.find(
      (budget) => budget.department.trim().toLowerCase() === expense.category.trim().toLowerCase()
    );
    if (matched) {
      await store.setBudget({
        ...matched,
        spent: Math.round((matched.spent + expense.amount) * 100) / 100,
      });
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

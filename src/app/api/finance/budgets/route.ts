import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, apiError } from "@/lib/api/request";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { requirePermission } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await requirePermission("finance:read");
    await ensureFinanceStack(ctx.scope);
    const budgets = await getFinanceStore().listBudgets(ctx.scope);
    return NextResponse.json({ budgets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

const createSchema = z.object({
  department: z.string().min(1),
  allocated: z.number().positive(),
  period: z.string().min(1),
  currency: z.string().optional(),
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

    const budget = await getFinanceStore().createBudget({
      ...ctx.scope,
      department: parsed.data.department.trim(),
      allocated: Math.round(parsed.data.allocated * 100) / 100,
      spent: 0,
      currency: parsed.data.currency ?? "GBP",
      period: parsed.data.period.trim(),
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, apiError } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";
import { getFinanceStore } from "@/lib/data/platform-store";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { requirePermission } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await requirePermission("finance:read");
    await ensureFinanceStack(ctx.scope);
    const accounts = await getFinanceStore().listChartOfAccounts(ctx.scope);
    return NextResponse.json({
      accounts: [...accounts].sort((a, b) => a.code.localeCompare(b.code)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

const createSchema = z.object({
  code: z.string().min(2).max(8),
  name: z.string().min(1),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  vatApplicable: z.boolean().optional(),
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
    const existing = await store.listChartOfAccounts(ctx.scope);
    const code = parsed.data.code.trim();
    if (existing.some((account) => account.code === code)) {
      return apiError("DUPLICATE", `Account ${code} already exists.`, 409);
    }

    const account = await store.createChartOfAccount({
      ...ctx.scope,
      code,
      name: parsed.data.name.trim(),
      type: parsed.data.type,
      vatApplicable: parsed.data.vatApplicable ?? false,
      currency: "GBP",
      active: true,
      createdAt: crmNow(),
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

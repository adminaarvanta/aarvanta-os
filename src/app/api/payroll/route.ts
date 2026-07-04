import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getFinanceStore } from "@/lib/data/platform-store";
import { runUkPayroll } from "@/lib/payroll/run-payroll";
import { requirePermission } from "@/lib/tenant/context";

const runSchema = z.object({
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

export async function GET() {
  try {
    const ctx = await requirePermission("payroll:read");
    const store = getFinanceStore();
    const [payRuns, payslips] = await Promise.all([
      store.listPayRuns(ctx.scope),
      store.listPayslips(ctx.scope),
    ]);
    return NextResponse.json({ payRuns, payslips });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("PAYROLL_ERROR", message, status);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("payroll:run");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = runSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await runUkPayroll(ctx.scope, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payroll failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("PAYROLL_ERROR", message, status);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { postJournalEntry } from "@/lib/finance/ledger";
import { requirePermission } from "@/lib/tenant/context";
import { getFinanceStore } from "@/lib/data/platform-store";

const journalSchema = z.object({
  date: z.string().optional(),
  reference: z.string().optional(),
  description: z.string(),
  lines: z.array(
    z.object({
      accountCode: z.string(),
      debit: z.number(),
      credit: z.number(),
      description: z.string().optional(),
    })
  ),
});

export async function GET() {
  try {
    const ctx = await requirePermission("finance:read");
    const entries = await getFinanceStore().listJournalEntries(ctx.scope);
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("LEDGER_ERROR", message, status);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("finance:write");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = journalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const entry = await postJournalEntry(ctx.scope, {
      date: parsed.data.date ?? new Date().toISOString().slice(0, 10),
      reference: parsed.data.reference ?? `JE-${Date.now().toString().slice(-6)}`,
      description: parsed.data.description,
      lines: parsed.data.lines,
      source: "manual",
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Post failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("LEDGER_ERROR", message, status);
  }
}

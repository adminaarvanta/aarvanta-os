import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, apiError } from "@/lib/api/request";
import { getFinanceStore } from "@/lib/data/platform-store";
import { crmNow } from "@/lib/data/crm-helpers";
import { ensureFinanceStack } from "@/lib/finance/ensure-platform-seed";
import { displayInvoiceStatus, nextInvoiceNumber, todayIsoDate } from "@/lib/finance/format";
import {
  postInvoicePaymentToLedger,
  postInvoiceToLedger,
} from "@/lib/finance/ledger";
import { requirePermission } from "@/lib/tenant/context";
import type { FinanceInvoice } from "@/types/platform-modules";

function withDisplayStatus(invoice: FinanceInvoice): FinanceInvoice {
  return {
    ...invoice,
    status: displayInvoiceStatus(invoice.status, invoice.dueDate),
  };
}

export async function GET() {
  try {
    const ctx = await requirePermission("finance:read");
    await ensureFinanceStack(ctx.scope);
    const invoices = await getFinanceStore().list(ctx.scope);
    return NextResponse.json({
      invoices: invoices
        .map(withDisplayStatus)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

const createSchema = z.object({
  clientName: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().min(1),
  description: z.string().optional(),
  vatIncluded: z.boolean().optional(),
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

    const store = getFinanceStore();
    const existing = await store.list(ctx.scope);
    const invoice = await store.create({
      ...ctx.scope,
      number: nextInvoiceNumber(existing),
      clientName: parsed.data.clientName.trim(),
      amount: Math.round(parsed.data.amount * 100) / 100,
      currency: parsed.data.currency ?? "GBP",
      status: "draft",
      dueDate: parsed.data.dueDate,
      description: parsed.data.description?.trim() || undefined,
      vatIncluded: parsed.data.vatIncluded ?? true,
      createdAt: crmNow(),
    });

    return NextResponse.json({ invoice: withDisplayStatus(invoice) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["send", "pay", "delete"]),
});

export async function PUT(req: Request) {
  try {
    const ctx = await requirePermission("finance:write");
    await ensureFinanceStack(ctx.scope);
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const store = getFinanceStore();
    const invoice = await store.get(parsed.data.id, ctx.scope);
    if (!invoice) {
      return apiError("NOT_FOUND", "Invoice not found", 404);
    }

    if (parsed.data.action === "delete") {
      if (invoice.status !== "draft") {
        return apiError("INVALID_STATUS", "Only draft invoices can be deleted.", 400);
      }
      await store.remove(invoice.id, ctx.scope);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === "send") {
      if (invoice.status !== "draft") {
        return apiError("INVALID_STATUS", "Only draft invoices can be sent.", 400);
      }
      const sent: FinanceInvoice = { ...invoice, status: "sent" };
      await store.set(sent);
      await postInvoiceToLedger(ctx.scope, sent);
      return NextResponse.json({ invoice: withDisplayStatus(sent) });
    }

    if (invoice.status === "paid") {
      return apiError("INVALID_STATUS", "Invoice is already paid.", 400);
    }
    if (invoice.status === "draft") {
      await postInvoiceToLedger(ctx.scope, invoice);
    }
    const paid: FinanceInvoice = {
      ...invoice,
      status: "paid",
      paidAt: todayIsoDate(),
    };
    await store.set(paid);
    await postInvoicePaymentToLedger(ctx.scope, paid);
    return NextResponse.json({ invoice: withDisplayStatus(paid) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return apiError("FINANCE_ERROR", message, status);
  }
}

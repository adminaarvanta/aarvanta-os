import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createScheduledCall,
  listScheduledCalls,
} from "@/lib/calling/scheduled-call-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().min(5),
  contactName: z.string().optional(),
  message: z.string().min(1).max(2000),
  scheduledAt: z.string().min(1),
});

export async function GET() {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const calls = await listScheduledCalls(ctx.scope);
  return NextResponse.json({
    calls: calls.filter((c) => c.status === "scheduled"),
  });
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledAt" }, { status: 400 });
  }
  if (scheduledAt.getTime() <= Date.now() + 60_000) {
    return NextResponse.json(
      { error: "Schedule at least 1 minute in the future, or use Call now." },
      { status: 400 }
    );
  }

  const call = await createScheduledCall(
    {
      phone: parsed.data.phone.trim(),
      contactName: parsed.data.contactName?.trim() || undefined,
      message: parsed.data.message.trim(),
      scheduledAt: scheduledAt.toISOString(),
    },
    ctx.scope
  );

  // Mirror as a CRM task so agents/ops see it on the task board.
  const dueDate = scheduledAt.toISOString().slice(0, 10);
  await getCrmRepository().createTask(
    {
      title: `Scheduled call: ${call.contactName ?? call.phone}`,
      description: `Phone: ${call.phone}\nWhen: ${call.scheduledAt}\nMessage: ${call.message}`,
      priority: "high",
      dueDate,
      source: "manual",
    },
    ctx.scope
  );

  return NextResponse.json({ call }, { status: 201 });
}

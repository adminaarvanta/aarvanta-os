import { NextResponse } from "next/server";
import { z } from "zod";
import { sendCallScheduledEmail } from "@/lib/calling/call-loop-email";
import {
  createScheduledCall,
  listScheduledCalls,
  updateScheduledCall,
} from "@/lib/calling/scheduled-call-store";
import { slotsFromSettings } from "@/lib/calling/schedule-slots";
import { normalizePhone } from "@/lib/data/conversation-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";
import { VOICE_TASK_AGENT } from "@/types/calling-agent";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().min(5),
  contactName: z.string().optional(),
  contactId: z.string().optional(),
  message: z.string().min(1).max(2000),
  scheduledAt: z.string().min(1),
  voiceAgentId: z.string().optional(),
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
    calls: calls.filter((c) => c.status === "scheduled" || c.status === "calling"),
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

  const crm = getCrmRepository();
  const phone = parsed.data.phone.trim();
  const normalized = normalizePhone(phone);
  let contact = parsed.data.contactId
    ? await crm.getContact(parsed.data.contactId, ctx.scope)
    : null;
  if (!contact) {
    const contacts = await crm.listContacts(ctx.scope);
    contact =
      contacts.find((c) => c.phone && normalizePhone(c.phone) === normalized) ??
      null;
  }

  const call = await createScheduledCall(
    {
      phone,
      contactName:
        parsed.data.contactName?.trim() ||
        (contact ? `${contact.firstName} ${contact.lastName}`.trim() : undefined),
      message: parsed.data.message.trim(),
      scheduledAt: scheduledAt.toISOString(),
      voiceAgentId: parsed.data.voiceAgentId?.trim() || undefined,
      contactId: contact?.id,
    },
    ctx.scope
  );

  const task = await crm.createTask(
    {
      title: `Scheduled call: ${call.contactName ?? call.phone}`,
      description: `Phone: ${call.phone}\nWhen: ${call.scheduledAt}\nMessage: ${call.message}`,
      priority: "high",
      dueDate: scheduledAt.toISOString(),
      contactId: contact?.id,
      accountId: contact?.accountId,
      source: "ai",
      assignedAgentType: VOICE_TASK_AGENT,
      voiceAgentId: call.voiceAgentId,
      scheduledCallId: call.id,
    },
    ctx.scope
  );
  await updateScheduledCall(call.id, { crmTaskId: task.id }, ctx.scope);

  if (contact) {
    const settings = await getWorkspaceSettings(ctx.scope.workspaceId);
    const { timeZone } = slotsFromSettings(settings);
    await sendCallScheduledEmail({
      contact,
      scope: ctx.scope,
      scheduledAt: call.scheduledAt,
      timeZone,
      kind: "scheduled",
    });
  }

  return NextResponse.json({ call, task }, { status: 201 });
}

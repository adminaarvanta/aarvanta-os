import { NextResponse } from "next/server";
import { z } from "zod";
import { deliverOutbound } from "@/lib/channels/deliver";
import { buildCallMemorySummary } from "@/lib/calling/call-memory";
import { normalizePhone } from "@/lib/data/conversation-helpers";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

const schema = z.object({
  phone: z.string().min(5),
  contactName: z.string().optional(),
  contactId: z.string().optional(),
  message: z.string().min(1).max(2000),
});

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

  const repo = getRepository();
  const calling = getCallingAgentRepository();
  const crm = getCrmRepository();
  const scope = ctx.scope;
  const phone = parsed.data.phone.trim();
  const normalized = normalizePhone(phone);

  let crmContact =
    parsed.data.contactId
      ? await crm.getContact(parsed.data.contactId, scope)
      : null;

  if (!crmContact) {
    const contacts = await crm.listContacts(scope);
    crmContact =
      contacts.find(
        (c) => c.phone && normalizePhone(c.phone) === normalized
      ) ?? null;
  }

  let conversation = await repo.findConversationByPhone(phone, scope);

  if (!conversation) {
    conversation = await repo.addInboundCall(
      {
        phone,
        contactName:
          parsed.data.contactName ??
          (crmContact ? contactDisplayName(crmContact) : phone),
        durationSeconds: 0,
        summary: "Outbound call initiated",
      },
      scope
    );
  }

  const agents = await calling.listAgents(scope);
  const agent = agents[0];
  const memorySummary = crmContact
    ? await buildCallMemorySummary(crmContact.id, scope)
    : undefined;

  const session = await calling.createSession(
    {
      contactId: crmContact?.id,
      voiceAgentId: agent?.id,
      conversationId: conversation.id,
      status: "ringing",
      memorySummary,
    },
    scope
  );

  const contact = {
    ...conversation.contact,
    phone: conversation.contact.phone ?? phone,
    name:
      parsed.data.contactName ??
      (crmContact ? contactDisplayName(crmContact) : conversation.contact.name),
  };

  let callSid: string | undefined;
  try {
    const delivery = await deliverOutbound({
      channel: "voice",
      contact,
      content: parsed.data.message,
      conversationId: conversation.id,
      voiceDirection: "outbound",
      contactId: crmContact?.id,
      sessionId: session.id,
      voiceAgentId: agent?.id,
    });
    callSid = delivery.callSid;
  } catch (error) {
    await calling.updateSession(
      session.id,
      { status: "failed", outcome: "failed" },
      scope
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Twilio voice delivery failed",
      },
      { status: 502 }
    );
  }

  await calling.updateSession(
    session.id,
    {
      status: "in_progress",
      callSid,
      summary: parsed.data.message,
    },
    scope
  );

  const updated = await repo.addOutboundCall(
    conversation.id,
    {
      summary: parsed.data.message,
      callSid,
      durationSeconds: 0,
    },
    scope,
    { name: ctx.name || "You", id: ctx.userId }
  );

  return NextResponse.json({
    conversationId: conversation.id,
    sessionId: session.id,
    contactId: crmContact?.id,
    callSid,
    conversation: updated,
  });
}

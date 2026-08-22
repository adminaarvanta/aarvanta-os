import { NextResponse } from "next/server";
import { deliverOutbound } from "@/lib/channels/deliver";
import { buildCallMemorySummary } from "@/lib/calling/call-memory";
import { resolveCallVoiceAgent } from "@/lib/calling/resolve-voice-agent";
import {
  listDueScheduledCalls,
  updateScheduledCall,
} from "@/lib/calling/scheduled-call-store";
import { normalizePhone } from "@/lib/data/conversation-helpers";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { crmNow } from "@/lib/data/crm-helpers";
import { contactDisplayName } from "@/types/crm";

export const runtime = "nodejs";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Places Twilio calls for scheduled entries that are due. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await listDueScheduledCalls(crmNow());
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const item of due) {
    const scope = {
      tenantId: item.tenantId,
      workspaceId: item.workspaceId,
      companyId: item.companyId,
    };
    try {
      const repo = getRepository();
      const calling = getCallingAgentRepository();
      const crm = getCrmRepository();

      let conversation = await repo.findConversationByPhone(item.phone, scope);
      if (!conversation) {
        conversation = await repo.addInboundCall(
          {
            phone: item.phone,
            contactName: item.contactName ?? item.phone,
            durationSeconds: 0,
            summary: "Scheduled outbound call",
          },
          scope
        );
      }

      const normalized = normalizePhone(item.phone);
      const contacts = await crm.listContacts(scope);
      const crmContact =
        contacts.find(
          (c) => c.phone && normalizePhone(c.phone) === normalized
        ) ?? null;
      const agent = await resolveCallVoiceAgent(scope, {
        voiceAgentId: item.voiceAgentId,
      });
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

      const delivery = await deliverOutbound({
        channel: "voice",
        contact: {
          ...conversation.contact,
          phone: conversation.contact.phone ?? item.phone,
          name:
            item.contactName ??
            (crmContact
              ? contactDisplayName(crmContact)
              : conversation.contact.name),
        },
        content: item.message,
        conversationId: conversation.id,
        voiceDirection: "outbound",
        contactId: crmContact?.id,
        sessionId: session.id,
        voiceAgentId: agent?.id,
      });

      await calling.updateSession(
        session.id,
        {
          status: "in_progress",
          callSid: delivery.callSid,
          summary: item.message,
        },
        scope
      );

      await repo.addOutboundCall(
        conversation.id,
        {
          summary: `[Scheduled] ${item.message}`,
          callSid: delivery.callSid,
          durationSeconds: 0,
        },
        scope,
        { name: "Scheduler", id: "system" }
      );

      await updateScheduledCall(
        item.id,
        { status: "completed", conversationId: conversation.id },
        scope
      );
      results.push({ id: item.id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      await updateScheduledCall(item.id, { status: "failed", error: message }, scope);
      results.push({ id: item.id, ok: false, error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

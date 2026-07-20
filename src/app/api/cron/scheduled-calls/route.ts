import { NextResponse } from "next/server";
import { deliverOutbound } from "@/lib/channels/deliver";
import {
  listDueScheduledCalls,
  updateScheduledCall,
} from "@/lib/calling/scheduled-call-store";
import { getRepository } from "@/lib/data/repository";
import { crmNow } from "@/lib/data/crm-helpers";

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

      await deliverOutbound({
        channel: "voice",
        contact: {
          ...conversation.contact,
          phone: conversation.contact.phone ?? item.phone,
        },
        content: item.message,
      });

      await repo.addOutboundCall(
        conversation.id,
        { summary: `[Scheduled] ${item.message}` },
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

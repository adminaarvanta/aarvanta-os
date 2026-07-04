import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/data/conversation-helpers";
import { normalizeMessageId } from "@/lib/data/email-threading";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import { parseSimulatedEmailEvent } from "@/lib/webhooks/email";

/** Dev/test only — simulates inbound email without Gmail IMAP. Production uses /api/cron/sync-email. */
export async function POST(req: Request) {
  const rawBody = await req.text();

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scope = getWebhookTenantScope();
  const repo = getRepository();
  const events = parseSimulatedEmailEvent(payload);
  const errors: Array<{ messageId: string; error: string }> = [];
  let processed = 0;
  let skipped = 0;

  if (events.length === 0) {
    return NextResponse.json({
      received: true,
      processed: 0,
      ignored: true,
      hint:
        'Send { "simulate": true, "from": "user@example.com", "subject": "...", "text": "..." } for dev testing. Production inbound uses Gmail IMAP sync at /api/cron/sync-email.',
    });
  }

  for (const event of events) {
    if (await isWebhookProcessed("email", event.messageId)) {
      skipped += 1;
      continue;
    }

    try {
      const fromEmail = normalizeEmail(event.from);
      if (!fromEmail) {
        errors.push({ messageId: event.messageId, error: "Missing sender address" });
        continue;
      }

      const inboundMessageId = event.rfcMessageId
        ? normalizeMessageId(event.rfcMessageId)
        : undefined;

      await repo.addInboundEmail(
        {
          email: fromEmail,
          contactName: fromEmail.split("@")[0],
          subject: event.subject,
          body: event.body,
          to: event.to,
          providerId: event.messageId,
          messageId: inboundMessageId,
        },
        scope
      );

      await markWebhookProcessed("email", event.messageId, scope);
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ messageId: event.messageId, error: message });
    }
  }

  return NextResponse.json({
    received: true,
    processed,
    skipped,
    ...(errors.length > 0 ? { errors } : {}),
  });
}

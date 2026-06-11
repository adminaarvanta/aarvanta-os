import { NextResponse } from "next/server";
import { fetchResendReceivedEmail } from "@/lib/channels/resend-client";
import { normalizeEmail } from "@/lib/data/conversation-helpers";
import { normalizeMessageId } from "@/lib/data/email-threading";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import { parseResendWebhookEvent } from "@/lib/webhooks/email";

const RESEND_EMAIL_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const events = parseResendWebhookEvent(payload);
  const errors: Array<{ messageId: string; error: string }> = [];
  let processed = 0;
  let skipped = 0;

  if (events.length === 0) {
    const eventType =
      payload && typeof payload === "object" && "type" in payload
        ? String((payload as { type?: string }).type ?? "unknown")
        : "unknown";

    console.warn("[email webhook] Ignored payload — type:", eventType);

    return NextResponse.json({
      received: true,
      processed: 0,
      ignored: true,
      eventType,
      hint:
        eventType !== "email.received"
          ? "Webhook must subscribe to email.received for inbound inbox. Sent/delivered events are ignored."
          : "Payload missing email_id — check Resend webhook configuration.",
    });
  }

  for (const event of events) {
    if (await isWebhookProcessed("email", event.messageId)) {
      skipped += 1;
      continue;
    }

    if (!RESEND_EMAIL_ID_RE.test(event.messageId)) {
      errors.push({
        messageId: event.messageId,
        error: "Invalid email_id — expected a Resend UUID",
      });
      continue;
    }

    try {
      const full = await fetchResendReceivedEmail(event.messageId);
      const fromEmail = normalizeEmail(full.from || event.from);

      if (!fromEmail) {
        errors.push({
          messageId: event.messageId,
          error: "Missing sender address",
        });
        continue;
      }

      const body = full.text?.trim();
      if (!body) {
        errors.push({
          messageId: event.messageId,
          error:
            "Email body empty — ensure RESEND_API_KEY has Full access (not send-only)",
        });
        continue;
      }

      const inboundMessageId = event.rfcMessageId
        ? normalizeMessageId(event.rfcMessageId)
        : undefined;

      await repo.addInboundEmail(
        {
          email: fromEmail,
          contactName: fromEmail.split("@")[0],
          subject: full.subject || event.subject,
          body,
          inReplyTo: full.inReplyTo,
          references: full.references,
          to: full.to.length > 0 ? full.to : (event.to ?? []),
          providerId: event.messageId,
          messageId: inboundMessageId,
        },
        scope
      );

      await markWebhookProcessed("email", event.messageId, scope);
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[email webhook]", event.messageId, error);
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

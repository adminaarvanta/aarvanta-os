import { NextResponse } from "next/server";
import { fetchResendReceivedEmail } from "@/lib/channels/resend-client";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import { parseResendWebhookEvent } from "@/lib/webhooks/email";

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
  let processed = 0;

  for (const event of events) {
    if (await isWebhookProcessed("email", event.messageId)) continue;

    try {
      const full = await fetchResendReceivedEmail(event.messageId);
      const fromEmail = full.from || event.from;

      if (!fromEmail) continue;

      await repo.addInboundEmail(
        {
          email: fromEmail,
          contactName: fromEmail.split("@")[0],
          subject: full.subject || event.subject,
          body: full.text,
        },
        scope
      );

      await markWebhookProcessed("email", event.messageId, scope);
      processed += 1;
    } catch (error) {
      console.error("[email webhook]", event.messageId, error);
    }
  }

  return NextResponse.json({ received: true, processed });
}

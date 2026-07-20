import { NextResponse } from "next/server";
import { isProductionMode } from "@/lib/config/app-mode";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import { parseTwilioSms, verifyTwilioSignature } from "@/lib/webhooks/twilio";
import { parseTwilioVoiceStatus } from "@/lib/webhooks/twilio-voice";

async function parseTwilioBody(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const rawBody = await req.text();

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });
    return { data, rawBody };
  }

  const data =
    rawBody.length > 0
      ? (JSON.parse(rawBody) as Record<string, string>)
      : {};
  return { data, rawBody };
}

export async function POST(req: Request) {
  const { data } = await parseTwilioBody(req);

  if (isProductionMode()) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      return NextResponse.json(
        { error: "Twilio auth token not configured" },
        { status: 500 }
      );
    }

    const signature = req.headers.get("x-twilio-signature");
    const url = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`
      : req.url;

    if (!verifyTwilioSignature(authToken, signature, url, data)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const scope = getWebhookTenantScope();
  const repo = getRepository();

  const sms = parseTwilioSms(data);
  if (sms) {
    if (await isWebhookProcessed("twilio_sms", sms.messageId)) {
      return NextResponse.json({ received: true, processed: 0, duplicate: true });
    }

    await repo.addInboundMessage(
      { phone: sms.phone, channel: "sms", content: sms.content },
      scope
    );
    await markWebhookProcessed("twilio_sms", sms.messageId, scope);
    return NextResponse.json({ received: true, processed: 1, type: "sms" });
  }

  const call = parseTwilioVoiceStatus(data);
  if (call) {
    // Dedupe per call + terminal status (Twilio may retry; sid alone is not enough
    // if we ever process intermediate events).
    const eventKey = `${call.callSid}:${call.status}`;
    if (await isWebhookProcessed("twilio_voice", eventKey)) {
      return NextResponse.json({ received: true, processed: 0, duplicate: true });
    }

    if (call.direction === "outbound") {
      let conversation = await repo.findConversationByPhone(call.phone, scope);
      if (!conversation) {
        conversation = await repo.ensurePhoneConversation(
          { phone: call.phone, channel: "voice" },
          scope
        );
      }
      await repo.addOutboundCall(
        conversation.id,
        {
          summary: call.summary,
          durationSeconds: call.durationSeconds,
        },
        scope
      );
    } else {
      await repo.addInboundCall(
        {
          phone: call.phone,
          durationSeconds: call.durationSeconds,
          summary: call.summary,
        },
        scope
      );
    }

    await markWebhookProcessed("twilio_voice", eventKey, scope);
    return NextResponse.json({
      received: true,
      processed: 1,
      type: "voice",
      direction: call.direction,
    });
  }

  return NextResponse.json({ received: true, processed: 0 });
}

import { NextResponse } from "next/server";
import { isProductionMode } from "@/lib/config/app-mode";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import { verifyTwilioSignature } from "@/lib/webhooks/twilio";

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

/**
 * Twilio RecordingStatusCallback — attaches RecordingSid/Url to the call timeline.
 */
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
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/recording`
      : req.url;

    if (!verifyTwilioSignature(authToken, signature, url, data)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const recordingSid = data.RecordingSid?.trim();
  const callSid = data.CallSid?.trim();
  const status = data.RecordingStatus?.trim().toLowerCase();
  const recordingUrl = data.RecordingUrl?.trim();

  if (!recordingSid || !callSid) {
    return NextResponse.json({ received: true, processed: 0 });
  }

  // Wait until media is available
  if (status && status !== "completed") {
    return NextResponse.json({ received: true, processed: 0, status });
  }

  if (await isWebhookProcessed("twilio_recording", recordingSid)) {
    return NextResponse.json({ received: true, processed: 0, duplicate: true });
  }

  const scope = getWebhookTenantScope();
  const repo = getRepository();

  const rawDirection = (data.Direction ?? "").toLowerCase();
  const isOutbound = rawDirection.startsWith("outbound");
  const phone = (isOutbound ? data.To : data.From)?.trim() || data.To || data.From;
  if (!phone) {
    return NextResponse.json({ received: true, processed: 0, reason: "no_phone" });
  }

  let conversation = await repo.findConversationByPhone(phone, scope);
  if (!conversation) {
    conversation = await repo.ensurePhoneConversation(
      { phone, channel: "voice" },
      scope
    );
  }

  const proxyPath = `/api/calling/recordings/${encodeURIComponent(recordingSid)}`;
  await repo.attachCallRecording(
    conversation.id,
    {
      recordingUrl: proxyPath,
      recordingSid,
      callSid,
    },
    scope
  );

  await markWebhookProcessed("twilio_recording", recordingSid, scope);

  return NextResponse.json({
    received: true,
    processed: 1,
    conversationId: conversation.id,
    recordingSid,
  });
}

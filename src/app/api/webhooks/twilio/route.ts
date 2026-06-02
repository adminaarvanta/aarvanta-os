import { NextResponse } from "next/server";
import { isProductionMode } from "@/lib/config/app-mode";
import { getRepository } from "@/lib/data/repository";
import { getProductionTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import { parseTwilioSms, verifyTwilioSignature } from "@/lib/webhooks/twilio";

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

  const sms = parseTwilioSms(data);
  if (!sms) {
    return NextResponse.json({ received: true, processed: 0 });
  }

  if (await isWebhookProcessed("twilio", sms.messageId)) {
    return NextResponse.json({ received: true, processed: 0, duplicate: true });
  }

  const scope = getProductionTenantScope();
  await getRepository().addInboundMessage(
    {
      phone: sms.phone,
      channel: "sms",
      content: sms.content,
    },
    scope
  );
  await markWebhookProcessed("twilio", sms.messageId, scope);

  return NextResponse.json({ received: true, processed: 1 });
}

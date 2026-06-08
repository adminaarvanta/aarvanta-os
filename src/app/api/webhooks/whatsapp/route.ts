import { NextResponse } from "next/server";
import { isProductionMode } from "@/lib/config/app-mode";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import {
  parseWhatsAppInbound,
  verifyWhatsAppSignature,
} from "@/lib/webhooks/whatsapp";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (isProductionMode()) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      return NextResponse.json(
        { error: "WhatsApp app secret not configured" },
        { status: 500 }
      );
    }

    const signature = req.headers.get("x-hub-signature-256");
    if (!verifyWhatsAppSignature(rawBody, signature, appSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scope = getWebhookTenantScope();
  const repo = getRepository();
  const inbound = parseWhatsAppInbound(payload);

  for (const message of inbound) {
    if (await isWebhookProcessed("whatsapp", message.messageId)) continue;

    await repo.addInboundMessage(
      {
        phone: message.phone,
        contactName: message.contactName,
        channel: "whatsapp",
        content: message.content,
      },
      scope
    );

    await markWebhookProcessed("whatsapp", message.messageId, scope);
  }

  return NextResponse.json({ received: true, processed: inbound.length });
}

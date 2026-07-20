import type { Channel, ContactRef } from "@/types/communication";
import {
  getChannelStatus,
  shouldSimulateChannel,
} from "@/lib/channels/config";
import { sendGmailEmail } from "@/lib/channels/gmail-client";

export interface DeliveryContext {
  channel: Channel;
  contact: ContactRef;
  content: string;
  subject?: string;
  html?: string;
  emailInReplyTo?: string;
  emailMessageId?: string;
}

async function sendWhatsAppMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp is not configured.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\s+/g, ""),
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`WhatsApp send failed (${response.status}): ${await response.text()}`);
  }
}

async function sendTwilioSms(to: string, text: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio SMS is not configured.");
  }

  const body = new URLSearchParams({ To: to, From: from, Body: text });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!response.ok) {
    throw new Error(`Twilio SMS failed (${response.status}): ${await response.text()}`);
  }
}

async function initiateTwilioVoiceCall(to: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!accountSid || !authToken || !from || !appUrl) {
    throw new Error("Twilio Voice is not configured (needs TWILIO_* and NEXT_PUBLIC_APP_URL).");
  }

  const base = appUrl.replace(/\/$/, "");
  const twimlUrl = `${base}/api/webhooks/twilio/twiml?message=${encodeURIComponent(message.slice(0, 1200))}`;
  const statusCallback = `${base}/api/webhooks/twilio`;
  const body = new URLSearchParams({
    To: to,
    From: from,
    Url: twimlUrl,
    // Twilio defaults to POST; we support both, but be explicit.
    Method: "POST",
    StatusCallback: statusCallback,
    StatusCallbackMethod: "POST",
  });
  // Terminal + progress events so Voice OS can log completed / busy / no-answer.
  for (const event of ["initiated", "ringing", "answered", "completed"]) {
    body.append("StatusCallbackEvent", event);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!response.ok) {
    throw new Error(`Twilio Voice failed (${response.status}): ${await response.text()}`);
  }
}

export async function deliverOutbound(ctx: DeliveryContext): Promise<void> {
  const status = getChannelStatus(ctx.channel);

  if (status === "simulate") {
    console.info(`[channels:simulate] ${ctx.channel} →`, {
      to: ctx.contact.phone ?? ctx.contact.email ?? ctx.contact.chatSessionId,
      content: ctx.content.slice(0, 80),
    });
    return;
  }

  if (status === "not_configured") {
    throw new Error(`${ctx.channel} is not configured. Set provider env vars or CHANNELS_SIMULATE=true.`);
  }

  switch (ctx.channel) {
    case "whatsapp": {
      if (!ctx.contact.phone) throw new Error("Contact has no phone for WhatsApp.");
      await sendWhatsAppMessage(ctx.contact.phone, ctx.content);
      return;
    }
    case "sms": {
      if (!ctx.contact.phone) throw new Error("Contact has no phone for SMS.");
      await sendTwilioSms(ctx.contact.phone, ctx.content);
      return;
    }
    case "email": {
      if (!ctx.contact.email) throw new Error("Contact has no email address.");
      const subject = ctx.subject?.trim() || "Message from Aarvanta";
      await sendGmailEmail({
        to: ctx.contact.email,
        subject,
        text: ctx.content,
        html: ctx.html,
        inReplyTo: ctx.emailInReplyTo,
        messageId: ctx.emailMessageId,
      });
      return;
    }
    case "voice": {
      if (!ctx.contact.phone) throw new Error("Contact has no phone for voice.");
      await initiateTwilioVoiceCall(ctx.contact.phone, ctx.content);
      return;
    }
    case "website_chat":
      return;
    default:
      throw new Error(`Unsupported channel: ${ctx.channel}`);
  }
}

export function canDeliver(channel: Channel): boolean {
  if (shouldSimulateChannel(channel)) return true;
  return getChannelStatus(channel) === "live";
}

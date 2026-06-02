import { isProductionMode } from "@/lib/config/app-mode";

export async function sendWhatsAppMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp outbound is not configured.");
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
    const detail = await response.text();
    throw new Error(`WhatsApp send failed (${response.status}): ${detail}`);
  }
}

export async function sendTwilioSms(to: string, text: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio outbound is not configured.");
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
    const detail = await response.text();
    throw new Error(`Twilio send failed (${response.status}): ${detail}`);
  }
}

export async function deliverOutboundMessage(
  channel: string,
  phone: string | undefined,
  content: string
) {
  if (!isProductionMode() || !phone) return;

  if (channel === "whatsapp") {
    await sendWhatsAppMessage(phone, content);
    return;
  }

  if (channel === "sms") {
    await sendTwilioSms(phone, content);
  }
}

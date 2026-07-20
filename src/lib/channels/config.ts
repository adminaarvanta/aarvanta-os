import type { Channel } from "@/types/communication";
import { isDemoMode, isProductionMode } from "@/lib/config/app-mode";

export type ChannelStatus = "live" | "simulate" | "not_configured";

export function isWhatsAppOutboundConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

/** Webhook verify + signature secret required for production inbound. */
export function isWhatsAppWebhookConfigured() {
  return Boolean(
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() &&
      process.env.WHATSAPP_APP_SECRET?.trim()
  );
}

export function isWhatsAppConfigured() {
  if (!isWhatsAppOutboundConfigured()) return false;
  // In production, require webhook secrets so inbound is actually secure/ready.
  if (isProductionMode() && !isWhatsAppWebhookConfigured()) return false;
  return true;
}

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim()
  );
}

export function isEmailConfigured() {
  return Boolean(
    process.env.GMAIL_USER?.trim() &&
      process.env.GMAIL_APP_PASSWORD?.trim() &&
      (process.env.EMAIL_FROM?.trim() || process.env.GMAIL_USER?.trim())
  );
}

export function isVoiceConfigured() {
  return (
    isSmsConfigured() && Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim())
  );
}

export function isWebsiteChatConfigured() {
  return true;
}

export function shouldSimulateChannel(_channel: Channel): boolean {
  if (process.env.CHANNELS_SIMULATE === "true") return true;
  if (isDemoMode()) return true;
  return false;
}

export function getChannelStatus(channel: Channel): ChannelStatus {
  if (channel === "website_chat") {
    return isWebsiteChatConfigured() ? "live" : "not_configured";
  }
  if (shouldSimulateChannel(channel)) return "simulate";

  const configured: Record<Channel, boolean> = {
    whatsapp: isWhatsAppConfigured(),
    sms: isSmsConfigured(),
    email: isEmailConfigured(),
    voice: isVoiceConfigured(),
    website_chat: true,
  };

  return configured[channel] ? "live" : "not_configured";
}

export function getAllChannelStatuses(): Record<Channel, ChannelStatus> {
  return {
    whatsapp: getChannelStatus("whatsapp"),
    sms: getChannelStatus("sms"),
    email: getChannelStatus("email"),
    voice: getChannelStatus("voice"),
    website_chat: getChannelStatus("website_chat"),
  };
}

export function getPublicWebhookUrls() {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (!base) {
    return {
      whatsapp: null as string | null,
      twilio: null as string | null,
      twilioTwiml: null as string | null,
    };
  }
  return {
    whatsapp: `${base}/api/webhooks/whatsapp`,
    twilio: `${base}/api/webhooks/twilio`,
    twilioTwiml: `${base}/api/webhooks/twilio/twiml`,
  };
}

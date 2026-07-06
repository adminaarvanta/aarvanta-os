import type { Channel } from "@/types/communication";
import { isDemoMode } from "@/lib/config/app-mode";

export type ChannelStatus = "live" | "simulate" | "not_configured";

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

export function isEmailConfigured() {
  return Boolean(
    process.env.GMAIL_USER &&
      process.env.GMAIL_APP_PASSWORD &&
      (process.env.EMAIL_FROM || process.env.GMAIL_USER)
  );
}

export function isVoiceConfigured() {
  return isSmsConfigured();
}

export function isWebsiteChatConfigured() {
  return true;
}

export function shouldSimulateChannel(channel: Channel): boolean {
  void channel;
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

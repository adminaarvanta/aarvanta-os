import type { Channel, Conversation } from "@/types/communication";

/** Prefer WhatsApp OS / Voice OS deep links over the legacy unified inbox. */
export function conversationOsHref(conversation: Conversation): string {
  const channels = conversation.channels ?? [];
  const hasWhatsApp =
    channels.includes("whatsapp") ||
    conversation.timeline.some(
      (e) => e.type === "message" && e.channel === "whatsapp"
    );
  const hasVoice =
    channels.includes("voice") ||
    conversation.timeline.some((e) => e.type === "call");

  if (hasWhatsApp && !hasVoice) return `/whatsapp/${conversation.id}`;
  if (hasVoice && !hasWhatsApp) return `/voice/${conversation.id}`;
  if (hasWhatsApp) return `/whatsapp/${conversation.id}`;
  if (hasVoice) return `/voice/${conversation.id}`;
  return `/inbox/${conversation.id}`;
}

export function channelOsHref(
  channel: Extract<Channel, "whatsapp" | "voice">,
  conversationId: string
): string {
  return channel === "whatsapp"
    ? `/whatsapp/${conversationId}`
    : `/voice/${conversationId}`;
}

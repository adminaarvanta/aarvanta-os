import type { Channel, Conversation } from "@/types/communication";
import { conversationOsHref } from "@/lib/channels/conversation-href";

export function conversationsForChannel(
  conversations: Conversation[],
  channel: Channel
): Conversation[] {
  return conversations.filter((c) => {
    if (c.channels.includes(channel)) return true;
    if (channel === "voice") {
      return c.timeline.some((e) => e.type === "call");
    }
    if (channel === "whatsapp") {
      return c.timeline.some(
        (e) => e.type === "message" && e.channel === "whatsapp"
      );
    }
    return false;
  });
}

export function unreadForChannel(
  conversations: Conversation[],
  channel: Channel
): number {
  return conversationsForChannel(conversations, channel).reduce(
    (sum, c) => sum + (c.unreadCount ?? 0),
    0
  );
}

export { conversationOsHref };

import type { Conversation, TimelineEvent } from "@/types/communication";

function latestTimelineEvent(timeline: TimelineEvent[]): TimelineEvent | undefined {
  if (timeline.length === 0) return undefined;
  return [...timeline].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )[0];
}

/** Strip heavy timeline payloads for inbox lists, search, and polling. */
export function toConversationListItem(conv: Conversation): Conversation {
  const last = latestTimelineEvent(conv.timeline);
  return {
    ...conv,
    timelineEventCount: conv.timeline.length,
    timeline: last ? [last] : [],
  };
}

export function conversationListPreview(conv: Conversation): string {
  if (conv.aiSummary) return conv.aiSummary;
  const last = conv.timeline[0];
  if (!last) return "No activity";
  switch (last.type) {
    case "message":
      return last.content;
    case "email":
      return last.subject;
    case "call":
      return last.summary ?? "Phone call";
    case "note":
      return `Note: ${last.content}`;
    case "meeting":
      return `Meeting: ${last.title}`;
    default:
      return "";
  }
}

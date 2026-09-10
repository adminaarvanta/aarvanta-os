import type { Conversation } from "@/types/communication";
import type { CrmActivity } from "@/types/crm";
import type { DomainEvent } from "@/types/events";

export type CustomerTimelineItem = {
  id: string;
  at: string;
  title: string;
  detail?: string;
  href?: string;
  channel?: string;
  source: "activity" | "conversation" | "event" | "note";
};

export function mergeCustomerTimeline(input: {
  activities: CrmActivity[];
  conversations: Conversation[];
  events: DomainEvent[];
  notes?: string;
}): CustomerTimelineItem[] {
  const items: CustomerTimelineItem[] = [];

  for (const activity of input.activities) {
    items.push({
      id: `act-${activity.id}`,
      at: activity.occurredAt,
      title: activity.title,
      detail: activity.description,
      source: "activity",
      channel: activity.type,
    });
  }

  for (const conversation of input.conversations) {
    items.push({
      id: `conv-${conversation.id}`,
      at: conversation.lastActivityAt,
      title: `Conversation with ${conversation.contact.name}`,
      detail: conversation.aiSummary,
      href: `/inbox/${conversation.id}`,
      channel: conversation.channels[0],
      source: "conversation",
    });
  }

  for (const event of input.events) {
    items.push({
      id: `evt-${event.id}`,
      at: event.timestamp,
      title: event.type.replace(/\./g, " "),
      source: "event",
    });
  }

  if (input.notes?.trim()) {
    items.push({
      id: "note-profile",
      at: input.activities[0]?.occurredAt ?? new Date().toISOString(),
      title: "Profile note",
      detail: input.notes,
      source: "note",
    });
  }

  return items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

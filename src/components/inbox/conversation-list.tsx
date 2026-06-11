"use client";

import { useEffect, useState } from "react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_LABELS, TAG_LABELS } from "@/lib/constants";
import { cn, formatRelative } from "@/lib/utils";
import { SentimentBadge } from "@/components/inbox/sentiment-badge";
import type { Conversation } from "@/types/communication";

function lastPreview(conv: Conversation): string {
  const last = [...conv.timeline].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )[0];
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

export function ConversationList({
  conversations: initialConversations,
  activeId,
  pollMs = 8000,
}: {
  conversations: Conversation[];
  activeId?: string;
  pollMs?: number;
}) {
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    if (pollMs <= 0) return;

    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/conversations");
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { conversations?: Conversation[] };
        if (data.conversations) setConversations(data.conversations);
      } catch {
        // ignore polling errors
      }
    }

    const interval = window.setInterval(refresh, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pollMs, activeId]);

  return (
    <ul className="divide-y divide-[#3d3528]/80">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const unreadCount = isActive ? 0 : conv.unreadCount;
        return (
          <li key={conv.id}>
            <PendingLink
              href={`/inbox/${conv.id}`}
              pendingClassName="opacity-60 pointer-events-none"
              className={cn(
                "block px-4 py-3.5 transition-colors hover:bg-[#1a1714]",
                isActive && "bg-[#D4AF37]/10"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-[#F5E6C8]">{conv.contact.name}</p>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] px-1.5 text-[10px] font-medium text-black">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-[#A89878]">
                {lastPreview(conv)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge className="bg-[#101010] text-[#A89878] ring-[#3d3528] text-[10px]">
                  {CHANNEL_LABELS[conv.channels[0]]}
                  {conv.channels.length > 1 && ` +${conv.channels.length - 1}`}
                </Badge>
                <SentimentBadge sentiment={conv.sentiment} />
                {conv.tags.slice(0, 1).map((t) => (
                  <Badge
                    key={t}
                    className="bg-[#D4AF37]/10 text-[#996515] ring-[#D4AF37]/25 text-[10px]"
                  >
                    {TAG_LABELS[t]}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-[#A89878]/80">
                {formatRelative(conv.lastActivityAt)}
              </p>
            </PendingLink>
          </li>
        );
      })}
    </ul>
  );
}

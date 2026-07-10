"use client";

import { useEffect, useState } from "react";
import { PendingLink } from "@/components/layout/navigation-provider";
import { Badge } from "@/components/ui/badge";
import { CHANNEL_LABELS, TAG_LABELS } from "@/lib/constants";
import { cn, formatRelative } from "@/lib/utils";
import { SentimentBadge } from "@/components/inbox/sentiment-badge";
import { conversationListPreview } from "@/lib/data/conversation-list-helpers";
import type { Conversation } from "@/types/communication";

export function ConversationList({
  conversations: initialConversations,
  activeId,
  pollMs = 30000,
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
    let interval: number | undefined;

    async function refresh() {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/conversations");
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { conversations?: Conversation[] };
        if (data.conversations) setConversations(data.conversations);
      } catch {
        // ignore polling errors
      }
    }

    function startPolling() {
      if (interval !== undefined) return;
      interval = window.setInterval(refresh, pollMs);
    }

    function stopPolling() {
      if (interval === undefined) return;
      window.clearInterval(interval);
      interval = undefined;
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh();
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (document.visibilityState === "visible") {
      startPolling();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollMs, activeId]);

  return (
    <ul className="divide-y divide-[#243656]/80">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const unreadCount = isActive ? 0 : conv.unreadCount;
        return (
          <li key={conv.id}>
            <PendingLink
              href={`/inbox/${conv.id}`}
              pendingClassName="opacity-60 pointer-events-none"
              className={cn(
                "block px-4 py-3.5 transition-colors hover:bg-[#162840]",
                isActive && "bg-[#B8965D]/10"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-[#FFFFFF]">{conv.contact.name}</p>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#B8965D] px-1.5 text-[10px] font-medium text-black">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-[#9AABC4]">
                {conversationListPreview(conv)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge className="bg-[#0D1524] text-[#9AABC4] ring-[#243656] text-[10px]">
                  {CHANNEL_LABELS[conv.channels[0]]}
                  {conv.channels.length > 1 && ` +${conv.channels.length - 1}`}
                </Badge>
                <SentimentBadge sentiment={conv.sentiment} />
                {conv.tags.slice(0, 1).map((t) => (
                  <Badge
                    key={t}
                    className="bg-[#B8965D]/10 text-[#94784A] ring-[#B8965D]/25 text-[10px]"
                  >
                    {TAG_LABELS[t]}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-[#9AABC4]/80">
                {formatRelative(conv.lastActivityAt)}
              </p>
            </PendingLink>
          </li>
        );
      })}
    </ul>
  );
}

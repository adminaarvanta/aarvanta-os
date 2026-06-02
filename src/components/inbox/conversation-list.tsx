import Link from "next/link";
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
  conversations,
  activeId,
}: {
  conversations: Conversation[];
  activeId?: string;
}) {
  return (
    <ul className="divide-y divide-[#EDE6D6]/80">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        return (
          <li key={conv.id}>
            <Link
              href={`/inbox/${conv.id}`}
              className={cn(
                "block px-4 py-3.5 transition-colors hover:bg-[#FCF9F2]",
                isActive && "bg-[#E8D4A8]/35"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-[#2A2418]">{conv.contact.name}</p>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#1e293b] px-1.5 text-[10px] font-medium text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-[#6B6356]">
                {lastPreview(conv)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge className="bg-white text-[#6B6356] ring-[#EDE6D6] text-[10px]">
                  {CHANNEL_LABELS[conv.channels[0]]}
                  {conv.channels.length > 1 && ` +${conv.channels.length - 1}`}
                </Badge>
                <SentimentBadge sentiment={conv.sentiment} />
                {conv.tags.slice(0, 1).map((t) => (
                  <Badge
                    key={t}
                    className="bg-[#C29B40]/10 text-[#9A7A32] ring-[#C29B40]/25 text-[10px]"
                  >
                    {TAG_LABELS[t]}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-[#6B6356]/80">
                {formatRelative(conv.lastActivityAt)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

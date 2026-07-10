"use client";

import { useEffect } from "react";
import {
  Bot,
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  StickyNote,
} from "lucide-react";
import { CHANNEL_LABELS } from "@/lib/constants";
import { scrollContainerToBottom } from "@/lib/scroll";
import { cn, formatRelative } from "@/lib/utils";
import type { TimelineEvent } from "@/types/communication";

function TimelineIcon({ event }: { event: TimelineEvent }) {
  const className = "h-4 w-4 shrink-0";
  switch (event.type) {
    case "message":
      return <MessageCircle className={className} />;
    case "call":
      return <Phone className={className} />;
    case "email":
      return <Mail className={className} />;
    case "note":
      return <StickyNote className={className} />;
    case "meeting":
      return <Calendar className={className} />;
    default:
      return <MessageCircle className={className} />;
  }
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  if (event.type === "message") {
    const outbound = event.direction === "outbound";
    return (
      <div
        className={cn("flex", outbound ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "max-w-[min(100%,20rem)] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[80%]",
            outbound
              ? "bg-[#162840] text-[#FFFFFF] ring-1 ring-[#B8965D]/30"
              : "bg-[#121E32] border border-[#243656] text-[#FFFFFF]"
          )}
        >
          <div className="mb-1 flex items-center gap-2 text-[10px] opacity-80">
            <TimelineIcon event={event} />
            <span>{CHANNEL_LABELS[event.channel]}</span>
            {event.isAiGenerated && (
              <span className="flex items-center gap-0.5">
                <Bot className="h-3 w-3" /> AI
              </span>
            )}
          </div>
          <p>{event.content}</p>
          <p
            className={cn(
              "mt-1 text-[10px]",
              outbound ? "text-[#C9AA72]" : "text-[#9AABC4]"
            )}
          >
            {formatRelative(event.occurredAt)}
            {event.authorName && ` · ${event.authorName}`}
          </p>
        </div>
      </div>
    );
  }

  if (event.type === "note") {
    return (
      <div className="rounded-xl border border-[#B8965D]/35 bg-[#2A2210] px-4 py-3 text-sm">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#C9AA72]">
          <StickyNote className="h-4 w-4" />
          {event.isInternal ? "Internal note" : "Note"}
          {event.authorName && ` · ${event.authorName}`}
        </div>
        <p className="text-[#FFFFFF]">{event.content}</p>
        <p className="mt-1 text-[10px] text-[#9AABC4]">
          {formatRelative(event.occurredAt)}
        </p>
      </div>
    );
  }

  if (event.type === "call") {
    return (
      <div className="rounded-xl border border-[#243656] bg-[#0D1524] px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#FFFFFF]">
          <Phone className="h-4 w-4 text-[#B8965D]" />
          {event.direction === "inbound" ? "Inbound" : "Outbound"} call ·{" "}
          {Math.round(event.durationSeconds / 60)} min
        </div>
        {event.summary && (
          <p className="mt-1 text-[#9AABC4]">{event.summary}</p>
        )}
        <p className="mt-1 text-[10px] text-[#9AABC4]">
          {formatRelative(event.occurredAt)}
        </p>
      </div>
    );
  }

  if (event.type === "email") {
    return (
      <div className="rounded-xl border border-[#243656] bg-[#0D1524] px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#FFFFFF]">
          <Mail className="h-4 w-4 text-[#B8965D]" />
          {event.direction === "inbound" ? "Received" : "Sent"}: {event.subject}
        </div>
        <p className="mt-1 text-[#9AABC4]">{event.bodyPreview}</p>
        <p className="mt-1 text-[10px] text-[#9AABC4]">
          {formatRelative(event.occurredAt)}
          {event.authorName && ` · ${event.authorName}`}
        </p>
      </div>
    );
  }

  if (event.type === "meeting") {
    return (
      <div className="rounded-xl border border-[#243656] bg-[#121E32] px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#FFFFFF]">
          <Calendar className="h-4 w-4 text-[#B8965D]" />
          {event.title}
        </div>
        <p className="mt-1 text-xs capitalize text-[#9AABC4]">
          {event.status} · {event.durationMinutes} min
        </p>
        <p className="mt-1 text-[10px] text-[#9AABC4]">
          {formatRelative(event.occurredAt)}
        </p>
      </div>
    );
  }

  return null;
}

export function ConversationTimeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  useEffect(() => {
    const container = document.querySelector<HTMLElement>("[data-conversation-scroll]");
    scrollContainerToBottom(
      container,
      sorted.length > 1 ? "smooth" : "auto"
    );
  }, [sorted.length, sorted.at(-1)?.id]);

  return (
    <div className="space-y-4">
      {sorted.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </div>
  );
}

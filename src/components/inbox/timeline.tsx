"use client";

import { useEffect, useRef } from "react";
import {
  Bot,
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  StickyNote,
} from "lucide-react";
import { CHANNEL_LABELS } from "@/lib/constants";
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
              ? "bg-[#1a1510] text-[#F5E6C8] ring-1 ring-[#D4AF37]/30"
              : "bg-[#141414] border border-[#3d3528] text-[#F5E6C8]"
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
              outbound ? "text-[#F9E076]" : "text-[#A89878]"
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
      <div className="rounded-xl border border-amber-700/40 bg-amber-950/40 px-4 py-3 text-sm">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-amber-300">
          <StickyNote className="h-4 w-4" />
          {event.isInternal ? "Internal note" : "Note"}
          {event.authorName && ` · ${event.authorName}`}
        </div>
        <p className="text-[#F5E6C8]">{event.content}</p>
        <p className="mt-1 text-[10px] text-[#A89878]">
          {formatRelative(event.occurredAt)}
        </p>
      </div>
    );
  }

  if (event.type === "call") {
    return (
      <div className="rounded-xl border border-[#3d3528] bg-[#101010] px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#F5E6C8]">
          <Phone className="h-4 w-4 text-[#D4AF37]" />
          {event.direction === "inbound" ? "Inbound" : "Outbound"} call ·{" "}
          {Math.round(event.durationSeconds / 60)} min
        </div>
        {event.summary && (
          <p className="mt-1 text-[#A89878]">{event.summary}</p>
        )}
        <p className="mt-1 text-[10px] text-[#A89878]">
          {formatRelative(event.occurredAt)}
        </p>
      </div>
    );
  }

  if (event.type === "email") {
    return (
      <div className="rounded-xl border border-[#3d3528] bg-[#101010] px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#F5E6C8]">
          <Mail className="h-4 w-4 text-[#D4AF37]" />
          {event.direction === "inbound" ? "Received" : "Sent"}: {event.subject}
        </div>
        <p className="mt-1 text-[#A89878]">{event.bodyPreview}</p>
        <p className="mt-1 text-[10px] text-[#A89878]">
          {formatRelative(event.occurredAt)}
          {event.authorName && ` · ${event.authorName}`}
        </p>
      </div>
    );
  }

  if (event.type === "meeting") {
    return (
      <div className="rounded-xl border border-[#3d3528] bg-[#141414] px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#F5E6C8]">
          <Calendar className="h-4 w-4 text-[#D4AF37]" />
          {event.title}
        </div>
        <p className="mt-1 text-xs capitalize text-[#A89878]">
          {event.status} · {event.durationMinutes} min
        </p>
        <p className="mt-1 text-[10px] text-[#A89878]">
          {formatRelative(event.occurredAt)}
        </p>
      </div>
    );
  }

  return null;
}

export function ConversationTimeline({ events }: { events: TimelineEvent[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: sorted.length > 1 ? "smooth" : "auto",
      block: "end",
    });
  }, [sorted.length, sorted.at(-1)?.id]);

  return (
    <div className="space-y-4">
      {sorted.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
      <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
    </div>
  );
}

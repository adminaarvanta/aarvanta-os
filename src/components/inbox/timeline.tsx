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
            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
            outbound
              ? "bg-[#1e293b] text-white"
              : "bg-white border border-[#EDE6D6] text-[#2A2418]"
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
              outbound ? "text-[#D4B06A]" : "text-[#6B6356]"
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
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-amber-900">
          <StickyNote className="h-4 w-4" />
          {event.isInternal ? "Internal note" : "Note"}
          {event.authorName && ` · ${event.authorName}`}
        </div>
        <p className="text-[#2A2418]">{event.content}</p>
        <p className="mt-1 text-[10px] text-[#6B6356]">
          {formatRelative(event.occurredAt)}
        </p>
      </div>
    );
  }

  if (event.type === "call") {
    return (
      <div className="rounded-xl border border-[#EDE6D6] bg-white px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#2A2418]">
          <Phone className="h-4 w-4 text-[#C29B40]" />
          {event.direction === "inbound" ? "Inbound" : "Outbound"} call ·{" "}
          {Math.round(event.durationSeconds / 60)} min
        </div>
        {event.summary && (
          <p className="mt-1 text-[#6B6356]">{event.summary}</p>
        )}
        <p className="mt-1 text-[10px] text-[#6B6356]">
          {formatRelative(event.occurredAt)}
        </p>
      </div>
    );
  }

  if (event.type === "email") {
    return (
      <div className="rounded-xl border border-[#EDE6D6] bg-white px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#2A2418]">
          <Mail className="h-4 w-4 text-[#C29B40]" />
          {event.direction === "inbound" ? "Received" : "Sent"}: {event.subject}
        </div>
        <p className="mt-1 text-[#6B6356]">{event.bodyPreview}</p>
        <p className="mt-1 text-[10px] text-[#6B6356]">
          {formatRelative(event.occurredAt)}
          {event.authorName && ` · ${event.authorName}`}
        </p>
      </div>
    );
  }

  if (event.type === "meeting") {
    return (
      <div className="rounded-xl border border-[#EDE6D6] bg-[#FCF9F2] px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-[#2A2418]">
          <Calendar className="h-4 w-4 text-[#C29B40]" />
          {event.title}
        </div>
        <p className="mt-1 text-xs capitalize text-[#6B6356]">
          {event.status} · {event.durationMinutes} min
        </p>
        <p className="mt-1 text-[10px] text-[#6B6356]">
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

  return (
    <div className="space-y-4">
      {sorted.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </div>
  );
}

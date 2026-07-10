"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw } from "lucide-react";
import { labelForEventType } from "@/lib/events/catalog";
import { entityTypeLabel } from "@/lib/entities/registry";
import type { DomainEvent } from "@/types/events";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function EventAuditPanel() {
  const [events, setEvents] = useState<DomainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events?limit=75");
      if (!res.ok) throw new Error("Failed to load events");
      const data = (await res.json()) as { events: DomainEvent[] };
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#9AABC4]">
          Every CRM mutation emits a domain event. This is the Phase 1 audit trail.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#243656] px-3 py-1.5 text-xs font-medium text-[#FFFFFF] hover:border-[#B8965D]/40 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-[#8B3A45]/45 bg-[#2A1218] px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && events.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[#243656] bg-[#121E32]"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#243656] bg-[#0D1524] p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-[#9AABC4]" />
          <p className="mt-3 text-sm text-[#FFFFFF]">No events yet</p>
          <p className="mt-1 text-xs text-[#9AABC4]">
            Create a contact, deal, or company in CRM to see events here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-[#243656] bg-[#0D1524] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#FFFFFF]">
                    {labelForEventType(event.type)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#9AABC4]">
                    {entityTypeLabel(event.entityType)} ·{" "}
                    <span className="font-mono text-[#B8965D]">{event.entityId}</span>
                  </p>
                </div>
                <time className="text-[10px] text-[#9AABC4]">
                  {formatTime(event.timestamp)}
                </time>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#9AABC4]">
                <span>
                  Actor: {event.actor.name ?? event.actor.id} ({event.actor.type})
                </span>
                <span>Source: {event.source}</span>
                <span className="font-mono">{event.type}</span>
              </div>
              {Object.keys(event.payload).length > 0 && (
                <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-[#040608] p-2 text-[10px] text-[#9AABC4]">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-[#9AABC4]">
        Rule packs:{" "}
        <Link href="/api/rules/evaluate" className="text-[#B8965D] hover:underline">
          GET /api/rules/evaluate
        </Link>{" "}
        · Events API:{" "}
        <Link href="/api/events" className="text-[#B8965D] hover:underline">
          GET /api/events
        </Link>
      </p>
    </div>
  );
}

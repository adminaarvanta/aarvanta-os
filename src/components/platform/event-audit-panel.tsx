"use client";

import { useCallback, useEffect, useState } from "react";
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

function actorLabel(event: DomainEvent) {
  if (event.actor.name) return event.actor.name;
  if (event.actor.type === "ai_agent") return "AI agent";
  if (event.actor.type === "organization") return "System";
  return "Team member";
}

function sourceLabel(source: string) {
  const map: Record<string, string> = {
    api: "App",
    workflow: "Workflow",
    ai: "AI agent",
    system: "System",
    webhook: "Integration",
  };
  return map[source] ?? "App";
}

/** Friendly one-line summary from payload without dumping raw JSON / IDs */
function payloadSummary(payload: Record<string, unknown>): string | null {
  const parts: string[] = [];
  for (const key of ["name", "title", "email", "status", "stage", "subject"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      parts.push(value.trim());
    }
  }
  if (parts.length === 0) return null;
  return parts.slice(0, 3).join(" · ");
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
      if (!res.ok) throw new Error("Failed to load activity");
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
        <p className="text-sm text-muted">
          A clear history of important changes across your CRM — who did what, and when.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-gold/40 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-danger/45 bg-danger/15 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading && events.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-border bg-surface-muted"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm text-foreground">No activity yet</p>
          <p className="mt-1 text-xs text-muted">
            Create a contact, deal, or company in CRM to see updates here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => {
            const summary = payloadSummary(event.payload);
            return (
              <li
                key={event.id}
                className="rounded-xl border border-border bg-surface-elevated p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {labelForEventType(event.type)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {entityTypeLabel(event.entityType)}
                      {summary ? ` · ${summary}` : ""}
                    </p>
                  </div>
                  <time className="text-[10px] text-muted">
                    {formatTime(event.timestamp)}
                  </time>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
                  <span>By {actorLabel(event)}</span>
                  <span>Via {sourceLabel(event.source)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

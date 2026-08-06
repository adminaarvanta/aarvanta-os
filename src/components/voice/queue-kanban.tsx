"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  VoiceStatusBadge,
  voiceToneForStatus,
  type VoiceTone,
} from "@/components/voice/voice-ui";
import { cn } from "@/lib/utils";
import type { QueueItemStatus } from "@/types/calling-agent";

export type QueueCard = {
  id: string;
  contactId: string;
  status: QueueItemStatus;
  contactName: string;
  companyName?: string;
  leadScore?: number;
  attemptCount: number;
  lastAttemptAt?: string;
  sessionId?: string;
};

const COLUMNS: {
  key: QueueItemStatus | "completed_bucket";
  label: string;
  match: QueueItemStatus[];
  tone: VoiceTone;
}[] = [
  { key: "pending", label: "Pending", match: ["pending"], tone: "blue" },
  { key: "calling", label: "Calling", match: ["calling"], tone: "cyan" },
  {
    key: "booked_meeting",
    label: "Meeting Booked",
    match: ["booked_meeting"],
    tone: "green",
  },
  {
    key: "completed_bucket",
    label: "Completed",
    match: [
      "completed",
      "not_interested",
      "failed",
      "no_answer",
      "voicemail",
      "busy",
      "wrong_number",
      "skipped",
      "callback_requested",
    ],
    tone: "slate",
  },
];

const columnChrome: Record<VoiceTone, string> = {
  navy: "border-[rgba(26,47,89,0.25)] bg-[rgba(26,47,89,0.04)]",
  gold: "border-[rgba(168,137,79,0.3)] bg-[rgba(168,137,79,0.06)]",
  cyan: "border-[rgba(14,165,198,0.3)] bg-[rgba(14,165,198,0.06)]",
  green: "border-[rgba(18,163,106,0.3)] bg-[rgba(18,163,106,0.06)]",
  blue: "border-[rgba(30,79,214,0.28)] bg-[rgba(30,79,214,0.05)]",
  amber: "border-[rgba(201,162,39,0.35)] bg-[rgba(201,162,39,0.08)]",
  rose: "border-[rgba(220,38,38,0.25)] bg-[rgba(220,38,38,0.05)]",
  slate: "border-border bg-surface-muted/40",
};

export function QueueKanban({
  items,
  campaignId,
}: {
  items: QueueCard[];
  campaignId?: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function action(kind: "retry" | "skip" | "call-now", queueId: string) {
    setBusyId(queueId);
    setError(null);
    try {
      const res = await fetch(`/api/voice/queue/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        sessionId?: string;
      };
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Action failed"
        );
        return;
      }
      if (kind === "call-now") {
        router.push(`/voice/live`);
        router.refresh();
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const canCallNow = (status: QueueItemStatus) =>
    status !== "calling" && status !== "booked_meeting";

  return (
    <div className="space-y-2">
      {error ? (
        <p className="px-4 text-sm text-red-400 sm:px-6" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3 overflow-x-auto p-4 sm:p-6">
        {COLUMNS.map((col) => {
          const cards = items.filter((i) => col.match.includes(i.status));
          return (
            <section
              key={col.key}
              className={cn(
                "w-80 shrink-0 rounded-2xl border shadow-sm",
                columnChrome[col.tone]
              )}
            >
              <header className="flex items-center justify-between border-b border-border/70 px-3 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {col.label}
                </h3>
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs font-semibold text-muted shadow-sm">
                  {cards.length}
                </span>
              </header>
              <ul className="space-y-2 p-2.5">
                {cards.map((card) => (
                  <li
                    key={card.id}
                    className="rounded-xl border border-border/80 bg-surface-elevated p-3 shadow-sm transition hover:shadow-md"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        if (card.sessionId) {
                          router.push(`/voice/history/${card.sessionId}`);
                        } else if (campaignId) {
                          router.push(`/voice/campaigns/${campaignId}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {card.contactName}
                        </p>
                        {card.leadScore != null ? (
                          <span className="rounded-md bg-[var(--chart-revenue-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--chart-revenue)]">
                            {card.leadScore}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {card.companyName ?? "—"}
                      </p>
                      <div className="mt-2">
                        <VoiceStatusBadge status={card.status} />
                      </div>
                      {card.status === "calling" ? (
                        <p className="mt-2 text-xs font-medium text-[var(--chart-ops)]">
                          ● Live now
                        </p>
                      ) : null}
                    </button>
                    {canCallNow(card.status) ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId === card.id}
                          onClick={() => void action("call-now", card.id)}
                        >
                          {busyId === card.id ? "Calling…" : "Call now"}
                        </Button>
                        {(card.status === "failed" ||
                          card.status === "busy" ||
                          card.status === "no_answer" ||
                          card.status === "voicemail" ||
                          card.status === "pending") && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busyId === card.id}
                              onClick={() => void action("retry", card.id)}
                            >
                              Retry later
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busyId === card.id}
                              onClick={() => void action("skip", card.id)}
                            >
                              Skip
                            </Button>
                          </>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
                {!cards.length ? (
                  <li className="px-2 py-8 text-center text-xs text-muted">
                    Empty lane
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export { voiceToneForStatus };

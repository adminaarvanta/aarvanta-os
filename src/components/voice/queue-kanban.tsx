"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

const COLUMNS: { key: QueueItemStatus | "completed_bucket"; label: string; match: QueueItemStatus[] }[] = [
  { key: "pending", label: "Pending", match: ["pending"] },
  { key: "calling", label: "Calling", match: ["calling"] },
  {
    key: "booked_meeting",
    label: "Meeting Booked",
    match: ["booked_meeting"],
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
  },
];

export function QueueKanban({
  items,
  campaignId,
}: {
  items: QueueCard[];
  campaignId?: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function action(kind: "retry" | "skip", queueId: string) {
    setBusyId(queueId);
    try {
      await fetch(`/api/voice/queue/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto p-4 sm:p-6">
      {COLUMNS.map((col) => {
        const cards = items.filter((i) => col.match.includes(i.status));
        return (
          <section
            key={col.key}
            className="w-72 shrink-0 rounded-xl border border-border bg-surface"
          >
            <header className="flex items-center justify-between border-b border-border px-3 py-2">
              <h3 className="text-sm font-medium text-foreground">{col.label}</h3>
              <span className="text-xs text-muted">{cards.length}</span>
            </header>
            <ul className="space-y-2 p-2">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="rounded-lg border border-border bg-surface-elevated p-3"
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
                    <p className="text-sm font-medium text-foreground">
                      {card.contactName}
                    </p>
                    <p className="text-xs text-muted">
                      {card.companyName ?? "—"}
                      {card.leadScore != null ? ` · Score ${card.leadScore}` : ""}
                    </p>
                    {card.status === "calling" && card.lastAttemptAt ? (
                      <p className="mt-1 text-xs text-gold">In progress</p>
                    ) : null}
                  </button>
                  {(card.status === "failed" ||
                    card.status === "busy" ||
                    card.status === "no_answer" ||
                    card.status === "voicemail" ||
                    card.status === "pending") && (
                    <div className="mt-2 flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyId === card.id}
                        onClick={() => void action("retry", card.id)}
                      >
                        Retry
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
                    </div>
                  )}
                </li>
              ))}
              {!cards.length ? (
                <li className="px-2 py-6 text-center text-xs text-muted">
                  Empty
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

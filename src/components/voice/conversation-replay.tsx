"use client";

import { useState } from "react";

type Props = {
  session: {
    id: string;
    contactName?: string;
    companyName?: string;
    phone?: string;
    outcome?: string;
    sentiment?: string;
    intent?: string;
    callScore?: number;
    recordingUrl?: string;
    summary?: string;
    transcript: { role: string; content: string; stage?: string }[];
    aiDecisions?: string[];
    crmUpdates?: string[];
  };
};

const TABS = ["Transcript", "AI Decisions", "Summary", "CRM Updates"] as const;

export function ConversationReplay({ session }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Transcript");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="rounded-xl border border-border bg-surface-elevated p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">
              {session.contactName ?? "Lead"}
            </h3>
            <p className="text-xs text-muted">
              {session.companyName ?? "—"} · {session.phone ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-border px-2 py-0.5 capitalize">
              {session.intent ?? "—"}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 capitalize">
              {session.sentiment ?? "—"}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 capitalize">
              {(session.outcome ?? "—").replace(/_/g, " ")}
            </span>
            {session.callScore != null ? (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold-bright">
                {session.callScore}/5
              </span>
            ) : null}
          </div>
        </div>
        {session.recordingUrl ? (
          <audio
            className="mt-4 w-full"
            controls
            src={session.recordingUrl}
            preload="metadata"
          />
        ) : (
          <p className="mt-4 text-xs text-muted">No recording available</p>
        )}
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${
              tab === t
                ? "border-b-2 border-gold text-gold-bright"
                : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Transcript" && (
        <div className="space-y-2">
          {session.transcript.map((t, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <p className="text-[10px] uppercase text-muted">
                {t.role}
                {t.stage ? ` · ${t.stage}` : ""}
              </p>
              <p className="text-foreground">{t.content}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "AI Decisions" && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {(session.aiDecisions ?? ["No AI decisions logged"]).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}

      {tab === "Summary" && (
        <p className="text-sm text-foreground">
          {session.summary ?? "No summary available."}
        </p>
      )}

      {tab === "CRM Updates" && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {(session.crmUpdates ?? ["No CRM updates logged"]).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

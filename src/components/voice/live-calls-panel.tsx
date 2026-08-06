"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VoiceEmptyState, VoiceStatusBadge } from "@/components/voice/voice-ui";

type LiveSession = {
  id: string;
  contactName?: string;
  phone?: string;
  jobTitle?: string;
  startedAt: string;
  currentStage?: string;
  intent?: string;
  intentConfidence?: number;
  qualification?: {
    painPoint?: boolean;
    budget?: boolean;
    decisionMaker?: boolean;
    timeline?: boolean;
  };
  transcript: { role: string; content: string }[];
  status: string;
};

export function LiveCallsPanel() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [nowMs, setNowMs] = useState(() => 0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/voice/sessions?status=in_progress");
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: LiveSession[] };
      if (!cancelled) setSessions(data.sessions);
    }
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!sessions.length) {
    return (
      <VoiceEmptyState
        title="No live AI calls right now"
        body="When a campaign dial is in progress, the transcript and qualification checklist appear here."
        action={
          <Link href="/voice/queue" className="text-sm font-medium text-gold hover:underline">
            Open queue →
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {sessions.map((session) => {
        const elapsed = Math.max(
          0,
          Math.floor((nowMs - new Date(session.startedAt).getTime()) / 1000)
        );
        const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const ss = String(elapsed % 60).padStart(2, "0");
        const q = session.qualification ?? {};
        return (
          <article
            key={session.id}
            className="grid overflow-hidden rounded-2xl border border-[rgba(14,165,198,0.28)] bg-surface-elevated shadow-sm lg:grid-cols-[1.4fr_1fr]"
          >
            <div className="p-4 sm:p-5">
              <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--chart-ops)] opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--chart-ops)]" />
                    </span>
                    <VoiceStatusBadge status="calling" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {session.contactName ?? "Unknown lead"}
                  </h3>
                  <p className="text-xs text-muted">
                    {session.jobTitle ?? "—"} · {session.phone ?? "—"}
                  </p>
                </div>
                <span className="rounded-xl bg-[var(--chart-ops-soft)] px-3 py-1.5 font-mono text-sm font-semibold text-[var(--chart-ops)]">
                  {mm}:{ss}
                </span>
              </header>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl bg-surface-muted/50 p-3">
                {session.transcript.map((t, i) => (
                  <div
                    key={`${session.id}-${i}`}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      t.role === "assistant"
                        ? "bg-surface-elevated text-foreground shadow-sm"
                        : "bg-[var(--chart-pipeline-soft)] text-foreground"
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {t.role === "assistant" ? "Ava" : "Lead"}
                    </p>
                    {t.content}
                  </div>
                ))}
              </div>
            </div>
            <aside className="border-t border-border bg-gradient-to-b from-[rgba(14,165,198,0.08)] to-transparent p-4 lg:border-l lg:border-t-0 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Current intent
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {session.intent ?? "—"}
                {session.intentConfidence != null
                  ? ` · ${Math.round(session.intentConfidence * 100)}%`
                  : ""}
              </p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Stage
              </p>
              <p className="mt-1 text-sm capitalize text-[var(--chart-ops)]">
                {(session.currentStage ?? "greeting").replace(/_/g, " ")}
              </p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Qualification
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {(
                  [
                    ["painPoint", "Pain point"],
                    ["budget", "Budget"],
                    ["decisionMaker", "Decision maker"],
                    ["timeline", "Timeline"],
                  ] as const
                ).map(([key, label]) => (
                  <li key={key} className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-md text-[10px] font-bold ${
                        q[key]
                          ? "bg-[var(--chart-ai)] text-white"
                          : "border border-border bg-surface text-muted"
                      }`}
                    >
                      {q[key] ? "✓" : ""}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <Link
                href={`/voice/history/${session.id}`}
                className="mt-5 inline-flex text-sm font-medium text-gold hover:underline"
              >
                Open session →
              </Link>
            </aside>
          </article>
        );
      })}
    </div>
  );
}

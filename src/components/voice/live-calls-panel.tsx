"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
      <p className="px-4 py-10 text-center text-sm text-muted sm:px-6">
        No live AI calls right now. Running campaigns will appear here.
      </p>
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
            className="grid gap-4 rounded-xl border border-border bg-surface-elevated lg:grid-cols-[1.4fr_1fr]"
          >
            <div className="p-4">
              <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {session.contactName ?? "Unknown lead"}
                  </h3>
                  <p className="text-xs text-muted">
                    {session.jobTitle ?? "—"} · {session.phone ?? "—"}
                  </p>
                </div>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs text-gold-bright">
                  {mm}:{ss}
                </span>
              </header>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {session.transcript.map((t, i) => (
                  <div
                    key={`${session.id}-${i}`}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      t.role === "assistant"
                        ? "bg-surface text-foreground"
                        : "bg-gold/10 text-foreground"
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-muted">
                      {t.role === "assistant" ? "Ava" : "Lead"}
                    </p>
                    {t.content}
                  </div>
                ))}
              </div>
            </div>
            <aside className="border-t border-border p-4 lg:border-l lg:border-t-0">
              <p className="text-xs uppercase tracking-wide text-muted">
                Current intent
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {session.intent ?? "—"}
                {session.intentConfidence != null
                  ? ` · ${Math.round(session.intentConfidence * 100)}%`
                  : ""}
              </p>
              <p className="mt-4 text-xs uppercase tracking-wide text-muted">
                Stage
              </p>
              <p className="mt-1 text-sm capitalize text-foreground">
                {(session.currentStage ?? "greeting").replace(/_/g, " ")}
              </p>
              <p className="mt-4 text-xs uppercase tracking-wide text-muted">
                Qualification
              </p>
              <ul className="mt-2 space-y-1 text-sm">
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
                      className={`inline-block h-3 w-3 rounded-sm border ${
                        q[key]
                          ? "border-gold bg-gold"
                          : "border-border bg-transparent"
                      }`}
                    />
                    {label}
                  </li>
                ))}
              </ul>
              <Link
                href={`/voice/history/${session.id}`}
                className="mt-4 inline-block text-sm text-gold hover:underline"
              >
                Open session
              </Link>
            </aside>
          </article>
        );
      })}
    </div>
  );
}

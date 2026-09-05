"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Briefcase,
  Megaphone,
  Phone,
  PhoneOff,
  Radio,
  UserRound,
} from "lucide-react";
import {
  VoiceEmptyState,
  VoiceStatChip,
  VoiceStatusBadge,
} from "@/components/voice/voice-ui";
import type { LiveCallPhase } from "@/lib/calling/stale-call-session";

type LiveSession = {
  id: string;
  contactName?: string;
  phone?: string;
  jobTitle?: string;
  companyName?: string;
  campaignName?: string;
  agentName?: string;
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
  phase?: LiveCallPhase;
  stale?: boolean;
  connectionNote?: string;
};

function formatLiveDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function emptyTranscriptCopy(session: LiveSession): string {
  if (session.phase === "ringing") return "Phone is ringing…";
  if (session.phase === "connecting") {
    return "Line is up. Waiting for the first spoken turn…";
  }
  if (session.phase === "stale" || session.stale) {
    return session.connectionNote || "Call did not connect…";
  }
  return session.connectionNote || "Transcript appears once someone speaks.";
}

function phaseOf(session: LiveSession): LiveCallPhase {
  if (session.phase) return session.phase;
  if (session.status === "ringing") return "ringing";
  return "live";
}

export function LiveCallsPanel() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [nowMs, setNowMs] = useState(() => 0);
  const [closedNotice, setClosedNotice] = useState(0);
  const [endingId, setEndingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/voice/sessions?status=live");
      if (!res.ok) return;
      const data = (await res.json()) as {
        sessions: LiveSession[];
        closedCount?: number;
      };
      if (cancelled) return;
      setSessions(data.sessions);
      if (data.closedCount && data.closedCount > 0) {
        setClosedNotice((prev) => prev + data.closedCount!);
      }
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

  const counts = useMemo(() => {
    const next = { live: 0, connecting: 0, ringing: 0, stale: 0 };
    for (const session of sessions) {
      next[phaseOf(session)] += 1;
    }
    return next;
  }, [sessions]);

  async function endCall(sessionId: string) {
    setEndingId(sessionId);
    try {
      const res = await fetch(`/api/voice/sessions/${sessionId}/end`, {
        method: "POST",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } finally {
      setEndingId(null);
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <VoiceStatChip label="Live" value={counts.live} tone="cyan" />
        <VoiceStatChip label="Connecting" value={counts.connecting} tone="blue" />
        <VoiceStatChip label="Ringing" value={counts.ringing} tone="amber" />
        <VoiceStatChip label="Stale" value={counts.stale} tone="rose" />
      </div>

      {closedNotice > 0 ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.08)] px-4 py-3 text-sm text-foreground">
          <p>
            {closedNotice} stuck session{closedNotice === 1 ? "" : "s"}{" "}
            {closedNotice === 1 ? "was" : "were"} closed automatically because
            the call never connected or went silent.
          </p>
          <button
            type="button"
            onClick={() => setClosedNotice(0)}
            className="shrink-0 text-xs font-semibold text-muted hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {!sessions.length ? (
        <VoiceEmptyState
          title="No live or ringing calls"
          body="When a campaign dials, you’ll see the phase (ringing, connecting, live), lead details, and transcript here."
          action={
            <Link
              href="/voice/queue"
              className="text-sm font-medium text-gold hover:underline"
            >
              Open queue →
            </Link>
          }
        />
      ) : (
        sessions.map((session) => {
          const phase = phaseOf(session);
          const elapsed = Math.max(
            0,
            Math.floor((nowMs - new Date(session.startedAt).getTime()) / 1000)
          );
          const clock = formatLiveDuration(elapsed);
          const q = session.qualification ?? {};
          const spoken = (session.transcript ?? []).filter(
            (t) => t.role !== "system" && t.content?.trim()
          );
          return (
            <article
              key={session.id}
              className="grid overflow-hidden rounded-2xl border border-[rgba(14,165,198,0.28)] bg-surface-elevated shadow-sm lg:grid-cols-[1.4fr_1fr]"
            >
              <div className="p-4 sm:p-5">
                <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      {phase === "live" ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--chart-ops)] opacity-60" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--chart-ops)]" />
                        </span>
                      ) : null}
                      <VoiceStatusBadge status={phase} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {session.contactName ?? "Unknown lead"}
                    </h3>
                    <ul className="mt-1.5 space-y-1 text-xs text-muted">
                      {session.companyName ? (
                        <li className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {session.companyName}
                        </li>
                      ) : null}
                      {session.jobTitle ? (
                        <li className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          {session.jobTitle}
                        </li>
                      ) : null}
                      <li className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {session.phone ?? "No phone on file"}
                      </li>
                    </ul>
                  </div>
                  <span
                    className={`rounded-xl px-3 py-1.5 font-mono text-sm font-semibold ${
                      phase === "stale"
                        ? "bg-[rgba(220,38,38,0.12)] text-[var(--chart-lost)]"
                        : "bg-[var(--chart-ops-soft)] text-[var(--chart-ops)]"
                    }`}
                  >
                    {clock}
                    {phase === "stale" ? " · stale" : ""}
                  </span>
                </header>
                {session.connectionNote ? (
                  <p className="mb-3 text-sm text-muted">{session.connectionNote}</p>
                ) : null}
                <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl bg-surface-muted/50 p-3">
                  {spoken.length ? (
                    spoken.map((t, i) => (
                      <div
                        key={`${session.id}-${i}`}
                        className={`rounded-xl px-3 py-2 text-sm ${
                          t.role === "assistant"
                            ? "bg-surface-elevated text-foreground shadow-sm"
                            : "bg-[var(--chart-pipeline-soft)] text-foreground"
                        }`}
                      >
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {t.role === "assistant"
                            ? session.agentName ?? "Ava"
                            : "Lead"}
                        </p>
                        {t.content}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                      <Radio className="mb-2 h-5 w-5 text-muted" />
                      <p className="text-sm font-medium text-foreground">
                        {emptyTranscriptCopy(session)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <aside className="border-t border-border bg-gradient-to-b from-[rgba(14,165,198,0.08)] to-transparent p-4 lg:border-l lg:border-t-0 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Current intent
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {session.intent ?? (phase === "live" ? "—" : "Waiting")}
                  {session.intentConfidence != null
                    ? ` · ${Math.round(session.intentConfidence * 100)}%`
                    : ""}
                </p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Stage
                </p>
                <p className="mt-1 text-sm capitalize text-[var(--chart-ops)]">
                  {(session.currentStage ?? (phase === "ringing" ? "ringing" : "greeting")).replace(
                    /_/g,
                    " "
                  )}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Campaign
                      </dt>
                      <dd className="text-foreground">
                        {session.campaignName ?? "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Agent
                      </dt>
                      <dd className="text-foreground">
                        {session.agentName ?? "—"}
                      </dd>
                    </div>
                  </div>
                </dl>
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
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={endingId === session.id}
                    onClick={() => void endCall(session.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(220,38,38,0.25)] bg-[rgba(220,38,38,0.08)] px-3 py-1.5 text-sm font-semibold text-[var(--chart-lost)] transition hover:bg-[rgba(220,38,38,0.14)] disabled:opacity-60"
                  >
                    <PhoneOff className="h-3.5 w-3.5" />
                    {endingId === session.id ? "Ending…" : "End call"}
                  </button>
                  <Link
                    href={`/voice/history/${session.id}`}
                    className="inline-flex text-sm font-medium text-gold hover:underline"
                  >
                    Open session →
                  </Link>
                </div>
              </aside>
            </article>
          );
        })
      )}
    </div>
  );
}

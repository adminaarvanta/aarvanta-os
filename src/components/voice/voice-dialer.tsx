"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Phone, PhoneOutgoing, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hasCustomVoiceSample,
  pickPreferredVoiceAgent,
} from "@/lib/channels/cloned-voice";
import { formatRelative } from "@/lib/utils";
import type { VoiceAgent } from "@/types/calling-agent";
import { contactDisplayName, type CrmContact } from "@/types/crm";

export type CallLogItem = {
  id: string;
  conversationId: string;
  contactName: string;
  phone?: string;
  direction: "inbound" | "outbound";
  durationSeconds: number;
  summary?: string;
  occurredAt: string;
  sessionId?: string;
  recordingUrl?: string;
};

type ScheduledCallItem = {
  id: string;
  phone: string;
  contactName?: string;
  message: string;
  scheduledAt: string;
  status: string;
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold";

const DEFAULT_BRIEFING =
  "Discovery call — introduce Aarvanta, understand their needs, and book a follow-up meeting if they are interested.";

export function VoiceDialer({ calls }: { calls: CallLogItem[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [query, setQuery] = useState("");
  const [contactId, setContactId] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState(DEFAULT_BRIEFING);
  const [scheduledAt, setScheduledAt] = useState("");
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [voiceAgentId, setVoiceAgentId] = useState("");
  const [primaryAgentId, setPrimaryAgentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledCallItem[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) return;
        const data = (await res.json()) as { contacts: CrmContact[] };
        setContacts(data.contacts ?? []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/voice/agents");
        if (!res.ok) return;
        const data = (await res.json()) as {
          agents: VoiceAgent[];
          primaryAgentId?: string | null;
        };
        const list = data.agents ?? [];
        setAgents(list);
        setPrimaryAgentId(data.primaryAgentId ?? "");
        setVoiceAgentId(
          (current) =>
            current ||
            pickPreferredVoiceAgent(list, data.primaryAgentId)?.id ||
            ""
        );
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function loadScheduled() {
    try {
      const res = await fetch("/api/calling/schedule");
      if (!res.ok) return;
      const data = (await res.json()) as { calls?: ScheduledCallItem[] };
      setScheduled(data.calls ?? []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void loadScheduled();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const withPhone = contacts.filter((c) => Boolean(c.phone?.trim()));
    if (!q) return withPhone.slice(0, 40);
    return withPhone
      .filter((c) => {
        const label = contactDisplayName(c).toLowerCase();
        return (
          label.includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.jobTitle ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 40);
  }, [contacts, query]);

  function selectContact(c: CrmContact) {
    setContactId(c.id);
    setPhone(c.phone?.trim() ?? "");
    setName(contactDisplayName(c));
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === "schedule") {
        if (!scheduledAt) {
          setError("Pick a date and time for the call");
          return;
        }
        const res = await fetch("/api/calling/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phone.trim(),
            contactName: name.trim() || undefined,
            contactId: contactId || undefined,
            message: message.trim(),
            scheduledAt: new Date(scheduledAt).toISOString(),
            voiceAgentId: voiceAgentId || undefined,
          }),
        });
        const data = (await res.json()) as {
          error?: string | { message?: string };
        };
        if (!res.ok) {
          setError(
            typeof data.error === "string"
              ? data.error
              : data.error?.message ?? "Could not schedule call"
          );
          return;
        }
        setSuccess("Call scheduled. It will dial automatically when due.");
        setScheduledAt("");
        await loadScheduled();
        router.refresh();
        return;
      }

      const res = await fetch("/api/calling/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          contactName: name.trim() || undefined,
          contactId: contactId || undefined,
          message: message.trim(),
          voiceAgentId: voiceAgentId || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string | { message?: string };
        conversationId?: string;
        sessionId?: string;
      };
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? "Call failed"
        );
        return;
      }
      setSuccess("Call initiated — opening live session.");
      if (data.sessionId) {
        router.push(`/voice/history/${data.sessionId}`);
      } else if (data.conversationId) {
        router.push(`/voice/${data.conversationId}`);
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-semibold text-foreground">
              Select person
            </h3>
          </div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search CRM people with phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-72 space-y-1 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
                No CRM contacts with a phone number.
              </li>
            ) : (
              filtered.map((c) => {
                const selected = contactId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => selectContact(c)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-[var(--navy)] bg-[var(--primary-soft)] dark:border-gold"
                          : "border-transparent hover:border-border hover:bg-surface"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-xs font-bold text-[var(--navy)] dark:text-gold">
                        {(c.firstName?.[0] ?? "?").toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {contactDisplayName(c)}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {c.phone}
                          {c.jobTitle ? ` · ${c.jobTitle}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <PhoneOutgoing className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-semibold text-foreground">
              Place call
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "now" ? "primary" : "secondary"}
              onClick={() => setMode("now")}
            >
              Call now
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "schedule" ? "primary" : "secondary"}
              onClick={() => setMode("schedule")}
            >
              <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
              Schedule
            </Button>
          </div>
          <p className="text-xs text-muted">
            {mode === "now"
              ? "Select a CRM person (or enter a number). The AI uses the briefing for context — not read word-for-word. Recording + transcript attach when enabled."
              : "Schedule for later. Due calls are dialed by the scheduler cron."}
          </p>
          {agents.length > 0 ? (
            <label className="block text-xs text-muted">
              Voice Agent
              <select
                className={`${inputClass} mt-1`}
                value={voiceAgentId}
                onChange={(e) => setVoiceAgentId(e.target.value)}
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                    {agent.id === primaryAgentId ? " · primary" : ""}
                    {hasCustomVoiceSample(agent) ? " · custom clone" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Phone (+91… / +1…)"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setContactId("");
              }}
              required
            />
            <input
              className={inputClass}
              placeholder="Contact name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {contactId ? (
            <p className="text-xs font-medium text-[var(--chart-ai)]">
              Linked to CRM contact — in-call booking enabled
            </p>
          ) : (
            <p className="text-xs text-muted">
              Tip: pick someone from the list so the AI can book meetings on the call.
            </p>
          )}
          {mode === "schedule" && (
            <input
              type="datetime-local"
              className={inputClass}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          )}
          <textarea
            className={`min-h-[96px] ${inputClass}`}
            placeholder="Call briefing for the AI"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" disabled={busy || !phone.trim()}>
              {busy
                ? mode === "schedule"
                  ? "Scheduling…"
                  : "Calling…"
                : mode === "schedule"
                  ? "Schedule call"
                  : "Call now"}
            </Button>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            {success ? <p className="text-xs text-success">{success}</p> : null}
          </div>
        </form>
      </div>

      {scheduled.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Upcoming scheduled
          </h3>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface-elevated">
            {scheduled.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {item.contactName ?? item.phone}
                </p>
                <p className="text-xs text-muted">
                  {item.phone} · {new Date(item.scheduledAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Recent voice calls
          </h3>
          <Link
            href="/voice/history"
            className="text-xs font-medium text-gold hover:underline"
          >
            Full history →
          </Link>
        </div>
        {calls.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No calls yet. Select a person and place an outbound call.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface-elevated">
            {calls.map((call) => (
              <li key={call.id} className="flex items-start gap-3 px-4 py-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={
                      call.sessionId
                        ? `/voice/history/${call.sessionId}`
                        : `/voice/${call.conversationId}`
                    }
                    className="text-sm font-medium text-foreground hover:text-gold"
                  >
                    {call.contactName}
                  </Link>
                  <p className="text-xs text-muted">
                    {call.direction} · {call.phone ?? "—"} ·{" "}
                    {formatRelative(call.occurredAt)}
                    {call.recordingUrl ? " · recording" : ""}
                  </p>
                  {call.summary ? (
                    <p className="mt-1 text-xs text-muted line-clamp-2">
                      {call.summary}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

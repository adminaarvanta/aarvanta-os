"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarClock, Phone, PhoneOutgoing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";

export type CallLogItem = {
  id: string;
  conversationId: string;
  contactName: string;
  phone?: string;
  direction: "inbound" | "outbound";
  durationSeconds: number;
  summary?: string;
  occurredAt: string;
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

export function CallingWorkspace({ calls }: { calls: CallLogItem[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState(
    "Hello, this is a call from Aarvanta. Please call us back when convenient."
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledCallItem[]>([]);

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
            message: message.trim(),
            scheduledAt: new Date(scheduledAt).toISOString(),
          }),
        });
        const data = (await res.json()) as {
          error?: string | { message?: string } | { formErrors?: string[] };
        };
        if (!res.ok) {
          setError(
            typeof data.error === "string"
              ? data.error
              : typeof data.error === "object" &&
                  data.error &&
                  "message" in data.error
                ? String(data.error.message)
                : "Could not schedule call"
          );
          return;
        }
        setSuccess("Call scheduled. It will dial automatically when due.");
        setPhone("");
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
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?: string | { message?: string };
        conversationId?: string;
      };
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? "Call failed"
        );
        return;
      }
      setSuccess("Call initiated via Twilio.");
      setPhone("");
      if (data.conversationId) {
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
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-border bg-surface-elevated p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <PhoneOutgoing className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-semibold text-foreground">Outbound call</h3>
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
            Schedule call
          </Button>
        </div>
        <p className="text-xs text-muted">
          {mode === "now"
            ? "Uses Twilio Voice to call the number and speak your message (TTS). Opens in Voice OS after dialing."
            : "Schedule a Twilio TTS call for later. Due calls are dialed by the scheduler cron."}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Phone (+447…)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            className={inputClass}
            placeholder="Contact name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          className={`min-h-[88px] ${inputClass}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={busy}>
            {busy
              ? mode === "schedule"
                ? "Scheduling…"
                : "Calling…"
              : mode === "schedule"
                ? "Schedule call"
                : "Call now"}
          </Button>
          {error && <p className="text-xs text-danger">{error}</p>}
          {success && <p className="text-xs text-success">{success}</p>}
        </div>
      </form>

      {scheduled.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Upcoming scheduled</h3>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface-elevated">
            {scheduled.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {item.contactName ?? item.phone}
                </p>
                <p className="text-xs text-muted">
                  {item.phone} · {new Date(item.scheduledAt).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted line-clamp-2">{item.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Call history</h3>
        {calls.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No calls yet. Place an outbound call, schedule one, or wait for inbound
            Twilio voice webhooks.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface-elevated">
            {calls.map((call) => (
              <li key={call.id} className="flex items-start gap-3 px-4 py-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/voice/${call.conversationId}`}
                    className="text-sm font-medium text-foreground hover:text-gold"
                  >
                    {call.contactName}
                  </Link>
                  <p className="text-xs text-muted">
                    {call.direction} · {call.phone ?? "—"} ·{" "}
                    {formatRelative(call.occurredAt)}
                  </p>
                  {call.summary && (
                    <p className="mt-1 text-xs text-muted line-clamp-2">{call.summary}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

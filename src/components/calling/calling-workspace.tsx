"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Phone, PhoneOutgoing } from "lucide-react";
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

export function CallingWorkspace({ calls }: { calls: CallLogItem[] }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState(
    "Hello, this is a call from Aarvanta. Please call us back when convenient."
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function placeCall(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
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
      router.refresh();
    } catch {
      setError("Network error placing call");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
      <form
        onSubmit={placeCall}
        className="rounded-xl border border-border bg-surface-elevated p-4 sm:p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <PhoneOutgoing className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-semibold text-foreground">Place outbound call</h3>
        </div>
        <p className="text-xs text-muted">
          Uses Twilio Voice to call the number and speak your message (TTS). Configure
          TWILIO_* env vars for live calls; demo mode simulates delivery.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Phone (+447…)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Contact name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <textarea
          className="min-h-[88px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Calling…" : "Call now"}
          </Button>
          {error && <p className="text-xs text-danger">{error}</p>}
          {success && <p className="text-xs text-success">{success}</p>}
        </div>
      </form>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Call history</h3>
        {calls.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No calls yet. Place an outbound call or wait for inbound Twilio voice
            webhooks.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-elevated">
            {calls.map((call) => (
              <li key={call.id}>
                <Link
                  href={`/inbox/${call.conversationId}`}
                  className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover"
                >
                  <Phone
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      call.direction === "outbound" ? "text-gold" : "text-accent-cyan"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{call.contactName}</p>
                      <span className="text-[10px] text-muted">
                        {formatRelative(call.occurredAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {call.direction === "outbound" ? "Outbound" : "Inbound"}
                      {call.phone ? ` · ${call.phone}` : ""}
                      {call.durationSeconds > 0
                        ? ` · ${call.durationSeconds}s`
                        : ""}
                    </p>
                    {call.summary && (
                      <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                        {call.summary}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

export function TestSendForm() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Aarvanta Email OS test");
  const [text, setText] = useState("This is a Brevo connectivity test from Aarvanta OS.");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/outreach/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, text }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        simulated?: boolean;
        messageId?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "Test send failed.");
        return;
      }
      setResult(
        data.simulated
          ? `Simulated (no Brevo key). Message id ${data.messageId}`
          : `Sent via Brevo. Message id ${data.messageId}`
      );
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Recipient</span>
        <input
          type="email"
          className={inputClass}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="you@company.com"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Subject</span>
        <input
          className={inputClass}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Body</span>
        <textarea
          className={`${inputClass} min-h-[100px]`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <Button type="button" size="sm" disabled={busy || !to} onClick={() => void send()}>
        {busy ? "Sending…" : "Send test email"}
      </Button>
      {result ? <p className="text-sm text-[var(--chart-ai)]">{result}</p> : null}
      {error ? <p className="text-sm text-[var(--chart-lost)]">{error}</p> : null}
    </div>
  );
}

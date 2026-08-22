"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VOICE_LANGUAGES } from "@/lib/channels/voice-catalog";
import type { VoiceAgent } from "@/types/calling-agent";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold";

export function CreateVoiceAgentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [greetingName, setGreetingName] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the new agent a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/voice/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          greetingName: greetingName.trim() || trimmed,
          language,
          ttsProvider: "ElevenLabs",
        }),
      });
      const data = (await res.json()) as {
        agent?: VoiceAgent;
        error?: { message?: string } | { formErrors?: string[] };
      };
      if (!res.ok || !data.agent) {
        const msg =
          data.error &&
          typeof data.error === "object" &&
          "message" in data.error &&
          typeof data.error.message === "string"
            ? data.error.message
            : "Could not create agent";
        throw new Error(msg);
      }
      router.push(`/voice/agents/${data.agent.id}/flow`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create agent");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="rounded-2xl border border-dashed border-gold/40 bg-surface-elevated p-4 shadow-sm"
    >
      <p className="text-sm font-semibold text-foreground">Create a new agent</p>
      <p className="mt-0.5 text-xs text-muted">
        Ava stays on the workspace catalog voice. Create a new persona, then
        clone your voice on that agent’s flow page.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs text-muted">
          Agent name
          <input
            className={`${inputClass} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maya"
            maxLength={80}
            required
            disabled={busy}
          />
        </label>
        <label className="block text-xs text-muted">
          Greeting name
          <input
            className={`${inputClass} mt-1`}
            value={greetingName}
            onChange={(e) => setGreetingName(e.target.value)}
            placeholder="Spoken on the call"
            maxLength={80}
            disabled={busy}
          />
        </label>
        <label className="block text-xs text-muted">
          Language
          <select
            className={`${inputClass} mt-1`}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={busy}
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={busy || !name.trim()}>
          {busy ? "Creating…" : "Create agent"}
        </Button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    </form>
  );
}

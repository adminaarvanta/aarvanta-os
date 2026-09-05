"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setPrimaryVoiceAgent } from "@/components/voice/set-primary-voice-agent";
import {
  hasCustomVoiceSample,
  isDefaultCatalogAgent,
} from "@/lib/channels/cloned-voice";
import type { VoiceAgent } from "@/types/calling-agent";

export function VoiceAgentCard({
  agent,
  isPrimary,
}: {
  agent: VoiceAgent;
  isPrimary: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const catalogDefault = isDefaultCatalogAgent(agent);
  const cloned = hasCustomVoiceSample(agent);

  async function onSetPrimary() {
    setBusy(true);
    setError(null);
    try {
      await setPrimaryVoiceAgent(agent.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set primary");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-sm font-bold text-[var(--navy)] dark:text-gold">
        {agent.name.slice(0, 1)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-foreground">{agent.name}</p>
        {isPrimary ? (
          <span className="rounded-full bg-[var(--chart-ai-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--chart-ai)]">
            Primary
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted">
        {agent.language}
        {catalogDefault
          ? " · Default catalog"
          : cloned
            ? " · Custom clone"
            : agent.ttsProvider
              ? ` · ${agent.ttsProvider}`
              : ""}{" "}
        · {agent.flowConfig.stages.length}-step playbook
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/voice/agents/${agent.id}/flow`}
          className="inline-flex text-sm font-medium text-gold hover:underline"
        >
          {catalogDefault && !cloned ? "Edit playbook →" : "Voice & playbook →"}
        </Link>
        {!isPrimary ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void onSetPrimary()}
          >
            {busy ? "Setting…" : "Set as primary"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

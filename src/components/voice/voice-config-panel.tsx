"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CUSTOM_VOICE_OPTION_ID,
  defaultVoiceIdFor,
  VOICE_CATALOG,
  VOICE_LANGUAGES,
  voicesForProvider,
} from "@/lib/channels/voice-catalog";
import type { ConversationRelayTtsProvider } from "@/lib/channels/voice-relay-tts";
import type { VoiceAgent } from "@/types/calling-agent";
import type { WorkspaceSettings } from "@/types/workspace-settings";

const PROVIDERS: Array<{ id: ConversationRelayTtsProvider; label: string }> = [
  { id: "ElevenLabs", label: "ElevenLabs" },
  { id: "Google", label: "Google" },
  { id: "Amazon", label: "Amazon Polly" },
];

const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold";

type VoicePrefs = Pick<
  WorkspaceSettings,
  | "voiceTtsProvider"
  | "voiceId"
  | "voiceLanguage"
  | "voiceCustomId"
  | "callRecordingEnabled"
  | "callRecordingAnnounce"
  | "voicePrimaryAgentId"
>;

function prefsFromSettings(s: WorkspaceSettings | null): VoicePrefs {
  const provider = s?.voiceTtsProvider ?? "ElevenLabs";
  const language = s?.voiceLanguage ?? "en-US";
  const custom = s?.voiceCustomId?.trim();
  return {
    voiceTtsProvider: provider,
    voiceLanguage: language,
    voiceCustomId: custom || undefined,
    voiceId: custom
      ? CUSTOM_VOICE_OPTION_ID
      : s?.voiceId ?? defaultVoiceIdFor(provider, language),
    callRecordingEnabled: Boolean(s?.callRecordingEnabled),
    callRecordingAnnounce: s?.callRecordingAnnounce !== false,
    voicePrimaryAgentId: s?.voicePrimaryAgentId,
  };
}

export function VoiceConfigPanel({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<VoicePrefs>(() => prefsFromSettings(null));
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [settingsRes, agentsRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/voice/agents"),
        ]);
        if (settingsRes.ok) {
          const data = (await settingsRes.json()) as { settings: WorkspaceSettings };
          if (!cancelled) setPrefs(prefsFromSettings(data.settings));
        }
        if (agentsRes.ok) {
          const data = (await agentsRes.json()) as {
            agents: VoiceAgent[];
            primaryAgentId?: string | null;
          };
          if (!cancelled) {
            setAgents(data.agents ?? []);
            if (data.primaryAgentId) {
              setPrefs((prev) => ({
                ...prev,
                voicePrimaryAgentId: data.primaryAgentId ?? undefined,
              }));
            }
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const provider = prefs.voiceTtsProvider ?? "ElevenLabs";
  const language = prefs.voiceLanguage ?? "en-US";
  const curated = useMemo(
    () => voicesForProvider(provider, language),
    [provider, language]
  );
  const isCustom =
    Boolean(prefs.voiceCustomId?.trim()) ||
    prefs.voiceId === CUSTOM_VOICE_OPTION_ID;

  async function save(next: VoicePrefs) {
    setPrefs(next);
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        voiceTtsProvider: next.voiceTtsProvider,
        voiceLanguage: next.voiceLanguage,
        voiceId:
          next.voiceId === CUSTOM_VOICE_OPTION_ID
            ? undefined
            : next.voiceId,
        voiceCustomId: next.voiceCustomId?.trim() || "",
        callRecordingEnabled: Boolean(next.callRecordingEnabled),
        callRecordingAnnounce: next.callRecordingAnnounce !== false,
        voicePrimaryAgentId: next.voicePrimaryAgentId ?? "",
      };
      const res = await fetch("/api/voice/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Save failed");
      }
      const data = (await res.json()) as { settings: WorkspaceSettings };
      setPrefs(prefsFromSettings(data.settings));
      setMessage("Saved");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function patch(partial: Partial<VoicePrefs>) {
    const next = { ...prefs, ...partial };
    if (partial.voiceTtsProvider || partial.voiceLanguage) {
      const p = next.voiceTtsProvider ?? "ElevenLabs";
      const lang = next.voiceLanguage ?? "en-US";
      if (!next.voiceCustomId?.trim()) {
        const stillValid = VOICE_CATALOG.some(
          (v) =>
            v.id === next.voiceId &&
            v.provider === p &&
            (v.languages.length === 0 || v.languages.includes(lang))
        );
        if (!stillValid) next.voiceId = defaultVoiceIdFor(p, lang);
      }
    }
    void save(next);
  }

  const providerLabel =
    PROVIDERS.find((p) => p.id === provider)?.label ?? provider;

  return (
    <div
      className={`rounded-xl border border-border bg-surface-elevated ${compact ? "p-3" : "p-4"} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
          aria-expanded={open}
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
          <span>{open ? "Hide voice settings" : "Voice settings"}</span>
        </button>
        {!open && !loading ? (
          <span className="shrink-0 text-xs text-muted">{providerLabel}</span>
        ) : open && saving ? (
          <span className="shrink-0 text-[10px] text-dim">Saving…</span>
        ) : open && message ? (
          <span className="shrink-0 text-[10px] text-muted">{message}</span>
        ) : null}
      </div>

      {open && loading ? (
        <p className="mt-3 text-sm text-muted">Loading voice settings…</p>
      ) : null}

      {open && !loading ? (
        <>
          <div className="mt-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {compact ? "Call voice" : "Voice configuration"}
              </p>
              {!compact ? (
                <p className="mt-0.5 text-xs text-muted">
                  Provider, language, and recording for catalog TTS. Pick a
                  primary Voice Agent so Dialer, inbound, and scheduled calls
                  use that persona (and its custom clone, if any).
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] text-muted">
                  Sarah/Rachel sound most natural for reception.
                </p>
              )}
            </div>
          </div>

          <div className={`mt-3 grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        <label className="block text-xs text-muted">
          Provider
          <select
            className={`${selectClass} mt-1`}
            value={provider}
            onChange={(e) =>
              patch({
                voiceTtsProvider: e.target.value as ConversationRelayTtsProvider,
                voiceCustomId: undefined,
              })
            }
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-muted">
          Language
          <select
            className={`${selectClass} mt-1`}
            value={language}
            onChange={(e) => patch({ voiceLanguage: e.target.value })}
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label className={`block text-xs text-muted ${compact ? "sm:col-span-2" : ""}`}>
          Voice
          <select
            className={`${selectClass} mt-1`}
            value={isCustom ? CUSTOM_VOICE_OPTION_ID : prefs.voiceId}
            onChange={(e) => {
              const v = e.target.value;
              if (v === CUSTOM_VOICE_OPTION_ID) {
                patch({ voiceId: CUSTOM_VOICE_OPTION_ID, voiceCustomId: prefs.voiceCustomId || "" });
              } else {
                patch({ voiceId: v, voiceCustomId: undefined });
              }
            }}
          >
            {curated.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
            <option value={CUSTOM_VOICE_OPTION_ID}>Custom voice ID…</option>
          </select>
        </label>

        {agents.length > 0 ? (
          <label className={`block text-xs text-muted ${compact ? "sm:col-span-2" : ""}`}>
            Primary Voice Agent
            <select
              className={`${selectClass} mt-1`}
              value={prefs.voicePrimaryAgentId ?? ""}
              onChange={(e) =>
                patch({ voicePrimaryAgentId: e.target.value || undefined })
              }
            >
              <option value="">Auto (first custom clone)</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                  {agent.clonedVoice?.status === "ready" ? " · custom clone" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {isCustom ? (
        <label className="mt-3 block text-xs text-muted">
          Custom Twilio / ElevenLabs voice ID
          <input
            className={`${selectClass} mt-1 font-mono text-xs`}
            value={prefs.voiceCustomId ?? ""}
            placeholder="Paste voice id from Twilio / ElevenLabs"
            onChange={(e) =>
              setPrefs((prev) => ({ ...prev, voiceCustomId: e.target.value }))
            }
            onBlur={() => void save(prefs)}
          />
        </label>
      ) : null}

      <div className="mt-4 space-y-3 border-t border-border-subtle pt-3">
        <label className="flex items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(prefs.callRecordingEnabled)}
            onChange={(e) => patch({ callRecordingEnabled: e.target.checked })}
          />
          <span>
            <span className="font-medium">Record calls</span>
            <span className="mt-0.5 block text-xs text-muted">
              Twilio dual-channel recording. Off by default for consent.
            </span>
          </span>
        </label>
        {prefs.callRecordingEnabled ? (
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={prefs.callRecordingAnnounce !== false}
              onChange={(e) => patch({ callRecordingAnnounce: e.target.checked })}
            />
            <span>
              <span className="font-medium">Announce recording</span>
              <span className="mt-0.5 block text-xs text-muted">
                Speaks a short notice when the call connects.
              </span>
            </span>
          </label>
        ) : null}
      </div>
        </>
      ) : null}
    </div>
  );
}

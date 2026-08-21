"use client";

import { Loader2, Mic, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isDemoClonedVoiceId } from "@/lib/channels/cloned-voice";
import type { VoiceAgent } from "@/types/calling-agent";

function errorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const err = (data as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

export function AgentVoiceCloneCard({ agent }: { agent: VoiceAgent }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<"upload" | "preview" | "remove" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [demoNote, setDemoNote] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cloned = agent.clonedVoice;
  const ready = cloned?.status === "ready";
  const simulated = ready && isDemoClonedVoiceId(cloned.elevenLabsVoiceId);

  async function onFilesSelected(list: FileList | null) {
    if (!list?.length) return;
    if (!consent) {
      setError("Confirm you have the right and consent to clone this voice.");
      return;
    }
    setBusy("upload");
    setError(null);
    setDemoNote(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    try {
      const form = new FormData();
      form.set("consent", "true");
      const files = Array.from(list).slice(0, 3);
      for (const file of files) form.append("files", file);
      const res = await fetch(`/api/voice/agents/${agent.id}/voice`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        error?: { message?: string } | string;
        demo?: boolean;
        requiresVerification?: boolean;
      };
      if (!res.ok) throw new Error(errorMessage(data, "Clone failed"));
      if (data.demo) {
        setDemoNote(
          "Demo mode saved a simulated clone. Live calls still use the workspace catalog voice."
        );
      } else if (data.requiresVerification) {
        setDemoNote(
          "Clone created. ElevenLabs may require extra verification before this voice is fully enabled."
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clone failed");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onPreview() {
    setBusy("preview");
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    try {
      const res = await fetch(`/api/voice/agents/${agent.id}/voice/preview`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(errorMessage(data, "Preview failed"));
      }
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(null);
    }
  }

  async function onRemove() {
    setBusy("remove");
    setError(null);
    setDemoNote(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    try {
      const res = await fetch(`/api/voice/agents/${agent.id}/voice`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(errorMessage(data, "Remove failed"));
      setConsent(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--navy)] dark:text-gold">
          <Mic className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">Custom voice</h3>
          <p className="mt-0.5 text-xs text-muted">
            Upload 1–2 minutes of clean speech (MP3 192kbps preferred). This
            clone is used on this agent’s calls. Workspace Voice settings remain
            the fallback.
          </p>
        </div>
      </div>

      {ready ? (
        <div className="mt-3 rounded-xl border border-border bg-background px-3 py-2">
          <p className="text-sm font-medium text-foreground">
            {cloned.name}
            {cloned.status === "ready" ? (
              <span className="ml-2 rounded-full bg-[var(--chart-ai-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--chart-ai)]">
                {simulated ? "Demo" : "Ready"}
              </span>
            ) : null}
          </p>
          {simulated || demoNote ? (
            <p className="mt-1 text-xs text-muted">
              {demoNote ??
                "Demo clone is simulated. Live calls use the workspace catalog voice."}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              Cloned {new Date(cloned.createdAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : cloned?.status === "failed" ? (
        <p className="mt-3 text-xs text-red-400">
          Last clone attempt failed. Upload new samples to try again.
        </p>
      ) : null}

      {previewUrl ? (
        <audio className="mt-3 w-full" controls src={previewUrl}>
          Preview
        </audio>
      ) : null}

      <label className="mt-3 flex items-start gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={busy !== null}
        />
        <span>
          I have the right and consent to clone this voice, and it will be used
          as this AI agent’s speaking voice.
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/webm,audio/ogg,.mp3,.wav,.m4a,.mp4,.webm,.ogg"
        multiple
        className="hidden"
        disabled={busy !== null || !consent}
        onChange={(e) => void onFilesSelected(e.target.files)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={busy !== null || !consent}
          onClick={() => inputRef.current?.click()}
        >
          {busy === "upload" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cloning…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              {ready ? "Replace samples" : "Upload samples"}
            </>
          )}
        </Button>
        {ready && !simulated ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void onPreview()}
          >
            {busy === "preview" ? "Generating…" : "Play preview"}
          </Button>
        ) : null}
        {cloned ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5"
            disabled={busy !== null}
            onClick={() => void onRemove()}
          >
            {busy === "remove" ? (
              "Removing…"
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Remove cloned voice
              </>
            )}
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </section>
  );
}

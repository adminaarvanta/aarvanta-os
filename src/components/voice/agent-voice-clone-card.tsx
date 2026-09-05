"use client";

import { Loader2, Mic, Square, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { setPrimaryVoiceAgent } from "@/components/voice/set-primary-voice-agent";
import {
  isDefaultCatalogAgent,
  isDemoClonedVoiceId,
} from "@/lib/channels/cloned-voice";
import {
  VOICE_CLONE_SCRIPT,
  VOICE_CLONE_TIPS,
} from "@/lib/channels/voice-clone-guidance";
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

function pickRecorderMime(): { mimeType: string; extension: string } {
  const candidates: Array<{ mimeType: string; extension: string }> = [
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/webm", extension: "webm" },
    { mimeType: "audio/mp4", extension: "m4a" },
    { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
  ];
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "", extension: "webm" };
  }
  const match = candidates.find((c) => MediaRecorder.isTypeSupported(c.mimeType));
  return match ?? { mimeType: "", extension: "webm" };
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const MIN_RECOMMENDED_SEC = 45;
const MAX_RECORD_SEC = 180;

export function AgentVoiceCloneCard({
  agent,
  isPrimary = false,
}: {
  agent: VoiceAgent;
  isPrimary?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const takeUrlRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [consent, setConsent] = useState(false);
  const [setAsPrimary, setSetAsPrimary] = useState(!isPrimary);
  const [busy, setBusy] = useState<
    "upload" | "preview" | "remove" | "primary" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [demoNote, setDemoNote] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [takeUrl, setTakeUrl] = useState<string | null>(null);
  const [takeFile, setTakeFile] = useState<File | null>(null);
  const [recorderReady, setRecorderReady] = useState(false);

  const cloned = agent.clonedVoice;
  const ready = cloned?.status === "ready";
  const simulated = ready && isDemoClonedVoiceId(cloned.elevenLabsVoiceId);
  const isDefault = isDefaultCatalogAgent(agent);

  useEffect(() => {
    setRecorderReady(
      typeof window !== "undefined" &&
        typeof MediaRecorder !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia)
    );
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (recording && elapsed >= MAX_RECORD_SEC) stopRecording();
  }, [elapsed, recording]);

  function stopTimer() {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRef.current = null;
  }

  function clearTake() {
    if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    takeUrlRef.current = null;
    setTakeUrl(null);
    setTakeFile(null);
    setElapsed(0);
  }

  async function cloneFiles(files: File[]) {
    if (!consent) {
      setError("Confirm you have the right and consent to clone this voice.");
      return;
    }
    if (!files.length) return;
    setBusy("upload");
    setError(null);
    setDemoNote(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    try {
      const form = new FormData();
      form.set("consent", "true");
      form.set("setPrimary", setAsPrimary ? "true" : "false");
      for (const file of files.slice(0, 3)) form.append("files", file);
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
      clearTake();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clone failed");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onFilesSelected(list: FileList | null) {
    if (!list?.length) return;
    await cloneFiles(Array.from(list));
  }

  async function startRecording() {
    setError(null);
    if (!consent) {
      setError("Confirm consent before recording.");
      return;
    }
    if (!recorderReady) {
      setError("This browser cannot record audio. Upload an MP3 or WAV instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const { mimeType, extension } = pickRecorderMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const file = new File([blob], `voice-sample.${extension}`, { type });
        if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
        const url = URL.createObjectURL(blob);
        takeUrlRef.current = url;
        setTakeFile(file);
        setTakeUrl(url);
        stopStream();
      };
      mediaRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch {
      setError("Microphone permission was denied.");
      stopStream();
    }
  }

  function stopRecording() {
    stopTimer();
    setRecording(false);
    const rec = mediaRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  async function onPreview() {
    setBusy("preview");
    setError(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    try {
      const res = await fetch(`/api/voice/agents/${agent.id}/voice/preview`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(errorMessage(data, "Preview failed"));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(null);
    }
  }

  async function onSetPrimary() {
    setBusy("primary");
    setError(null);
    try {
      await setPrimaryVoiceAgent(agent.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set primary");
    } finally {
      setBusy(null);
    }
  }

  async function onRemove() {
    setBusy("remove");
    setError(null);
    setDemoNote(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
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

  if (isDefault && !ready) {
    return (
      <section className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--navy)] dark:text-gold">
            <Mic className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Catalog voice (Ava)
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Ava is the default agent and keeps the workspace catalog voice
              (Sarah, Rachel, or whatever you pick in Voice settings). Clone a
              custom voice on a <span className="font-medium">new</span> agent
              instead of editing this one.
            </p>
            <Link
              href="/voice/agents"
              className="mt-3 inline-flex text-sm font-medium text-gold hover:underline"
            >
              Create a new agent →
            </Link>
          </div>
        </div>
      </section>
    );
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
            Record or upload a sample of the person this agent should sound
            like. Set it as primary so Dialer, inbound, and scheduled calls use
            this voice.
          </p>
          {isPrimary ? (
            <p className="mt-1 text-[11px] font-medium text-[var(--chart-ai)]">
              Primary agent for real calls
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Best results
        </p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted">
          {VOICE_CLONE_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <details className="mt-3 rounded-xl border border-border bg-background px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-foreground">
          Words to read while recording (~1 minute)
        </summary>
        <p className="mt-2 text-[11px] text-muted">
          Optional. Reading this out loud gives the clone a mix of greetings,
          questions, and numbers. Speak naturally — do not sound like you are
          reading a teleprompter.
        </p>
        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted">
          {VOICE_CLONE_SCRIPT}
        </p>
      </details>

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
              {isPrimary
                ? " · this agent is primary for Dialer, inbound, and scheduled calls."
                : " · set as primary so real calls use this clone."}
            </p>
          )}
        </div>
      ) : cloned?.status === "failed" ? (
        <p className="mt-3 text-xs text-red-400">
          Last clone attempt failed. Record or upload new samples to try again.
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
          checked={setAsPrimary || isPrimary}
          onChange={(e) => setSetAsPrimary(e.target.checked)}
          disabled={busy !== null || recording || isPrimary}
        />
        <span>
          Use this agent as the default for Dialer, inbound, and scheduled
          calls.
        </span>
      </label>

      <label className="mt-3 flex items-start gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={busy !== null || recording}
        />
        <span>
          I have the right and consent to clone this voice, and it will be used
          as this AI agent’s speaking voice.
        </span>
      </label>

      <div className="mt-3 rounded-xl border border-dashed border-border px-3 py-3">
        <p className="text-xs font-semibold text-foreground">Record in browser</p>
        <p className="mt-0.5 text-[11px] text-muted">
          Read the sample above in a quiet room. Aim for 1–2 minutes
          {elapsed > 0 ? ` · ${formatClock(elapsed)}` : ""}.
        </p>
        {takeUrl ? (
          <audio className="mt-2 w-full" controls src={takeUrl}>
            Your take
          </audio>
        ) : null}
        {takeFile && elapsed > 0 && elapsed < MIN_RECOMMENDED_SEC ? (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
            This take is under {MIN_RECOMMENDED_SEC}s. Clones are more stable
            with about a minute of clean speech.
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!recording ? (
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={busy !== null || !consent}
              onClick={() => void startRecording()}
            >
              <Mic className="h-3.5 w-3.5" />
              {takeFile ? "Re-record" : "Start recording"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={() => stopRecording()}
            >
              <Square className="h-3.5 w-3.5" />
              Stop {formatClock(elapsed)}
            </Button>
          )}
          {takeFile ? (
            <>
              <Button
                type="button"
                size="sm"
                disabled={busy !== null || recording}
                onClick={() => void cloneFiles([takeFile])}
              >
                {busy === "upload" ? "Cloning…" : "Use this recording"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy !== null || recording}
                onClick={() => clearTake()}
              >
                Discard
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/webm,audio/ogg,.mp3,.wav,.m4a,.mp4,.webm,.ogg"
        multiple
        className="hidden"
        disabled={busy !== null || !consent || recording}
        onChange={(e) => void onFilesSelected(e.target.files)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={busy !== null || !consent || recording}
          onClick={() => inputRef.current?.click()}
        >
          {busy === "upload" && !takeFile ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cloning…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              {ready ? "Replace with file" : "Upload file instead"}
            </>
          )}
        </Button>
        {ready && !simulated ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy !== null || recording}
            onClick={() => void onPreview()}
          >
            {busy === "preview" ? "Generating…" : "Play clone preview"}
          </Button>
        ) : null}
        {ready && !isPrimary ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy !== null || recording}
            onClick={() => void onSetPrimary()}
          >
            {busy === "primary" ? "Setting…" : "Set as primary for real calls"}
          </Button>
        ) : null}
        {cloned ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5"
            disabled={busy !== null || recording}
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

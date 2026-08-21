import { isDemoMode } from "@/lib/config/app-mode";

const ELEVENLABS_API = "https://api.elevenlabs.io";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 3;

const ALLOWED_EXT = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".mp4",
  ".webm",
  ".ogg",
  ".mpeg",
]);

const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
]);

export function getElevenLabsApiKey(): string | undefined {
  return process.env.ELEVENLABS_API_KEY?.trim() || undefined;
}

export function elevenLabsConfigured(): boolean {
  return Boolean(getElevenLabsApiKey());
}

export function fileExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i).toLowerCase() : "";
}

export function validateCloneAudioFile(file: File): void {
  if (file.size <= 0) {
    throw new Error(`Empty file: ${file.name}`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} exceeds 10 MB limit.`);
  }
  const ext = fileExtension(file.name);
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_EXT.has(ext) && !ALLOWED_MIME.has(mime)) {
    throw new Error(
      `${file.name} is not a supported audio type (mp3, wav, m4a, mp4, webm, ogg).`
    );
  }
}

export function collectCloneFiles(form: FormData): File[] {
  const files: File[] = [];
  for (const value of form.getAll("files")) {
    if (value instanceof File && value.size > 0) files.push(value);
  }
  const single = form.get("file");
  if (single instanceof File && single.size > 0) files.push(single);
  const unique = files.filter(
    (f, i, arr) => arr.findIndex((x) => x.name === f.name && x.size === f.size) === i
  );
  if (!unique.length) {
    throw new Error("Upload 1–3 audio samples (1–2 minutes of clean speech).");
  }
  if (unique.length > MAX_FILES) {
    throw new Error("Upload at most 3 audio files.");
  }
  for (const file of unique) validateCloneAudioFile(file);
  return unique;
}

export type InstantCloneResult = {
  voiceId: string;
  requiresVerification: boolean;
};

export async function createInstantVoiceClone(input: {
  name: string;
  files: File[];
  description?: string;
  labels: Record<string, string>;
}): Promise<InstantCloneResult> {
  if (isDemoMode()) {
    throw new Error("Demo mode should not call ElevenLabs.");
  }
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const body = new FormData();
  body.set("name", input.name);
  if (input.description) body.set("description", input.description);
  body.set("labels", JSON.stringify(input.labels));
  body.set("remove_background_noise", "true");
  for (const file of input.files) {
    body.append("files", file, file.name);
  }

  const res = await fetch(`${ELEVENLABS_API}/v1/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs clone failed (${res.status}): ${detail.slice(0, 400) || res.statusText}`
    );
  }
  const data = (await res.json()) as {
    voice_id?: string;
    requires_verification?: boolean;
  };
  if (!data.voice_id) {
    throw new Error("ElevenLabs did not return a voice id.");
  }
  return {
    voiceId: data.voice_id,
    requiresVerification: Boolean(data.requires_verification),
  };
}

export async function deleteElevenLabsVoice(voiceId: string): Promise<void> {
  if (isDemoMode() || !voiceId || voiceId.startsWith("demo_")) return;
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return;
  const res = await fetch(
    `${ELEVENLABS_API}/v1/voices/${encodeURIComponent(voiceId)}`,
    {
      method: "DELETE",
      headers: { "xi-api-key": apiKey },
    }
  );
  if (!res.ok && res.status !== 404) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs delete failed (${res.status}): ${detail.slice(0, 400) || res.statusText}`
    );
  }
}

export async function synthesizeElevenLabsMp3(input: {
  voiceId: string;
  text: string;
}): Promise<Buffer> {
  if (isDemoMode()) {
    throw new Error("Demo mode does not synthesize cloned audio.");
  }
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }
  const res = await fetch(
    `${ELEVENLABS_API}/v1/text-to-speech/${encodeURIComponent(input.voiceId)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: input.text,
        model_id: "eleven_flash_v2_5",
      }),
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS failed (${res.status}): ${detail.slice(0, 400) || res.statusText}`
    );
  }
  return Buffer.from(await res.arrayBuffer());
}

export function defaultPreviewText(greetingName: string, businessName?: string): string {
  const who = greetingName.trim() || "your agent";
  const brand = businessName?.trim();
  return brand
    ? `Hi, this is ${who} calling from ${brand}. How can I help you today?`
    : `Hi, this is ${who}. How can I help you today?`;
}

/**
 * Live ConversationRelay sidecar health.
 *
 * skipOpening landed in relay 1.9.2. Older processes (orbit is still 1.7.2)
 * ignore that TwiML param and always speak an LLM opening — so a TwiML
 * welcomeGreeting plus the old opening is a double intro.
 */

import { getVoiceRelayWssUrl } from "@/lib/channels/voice-relay";

export const SKIP_OPENING_SINCE = [1, 9, 2] as const;

export type VoiceRelayHealth = {
  version: string;
  honorsSkipOpening: boolean;
};

type CacheEntry = { at: number; health: VoiceRelayHealth | null };

const CACHE_MS = 20_000;
const FETCH_MS = 800;

let cache: CacheEntry | null = null;

export function parseRelayVersion(version: string | undefined | null): number[] | null {
  const match = (version ?? "").trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function compareSemver(a: number[], b: readonly number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return left < right ? -1 : 1;
  }
  return 0;
}

export function relayHonorsSkipOpening(version: string | undefined | null): boolean {
  const parsed = parseRelayVersion(version);
  if (!parsed) return false;
  return compareSemver(parsed, SKIP_OPENING_SINCE) >= 0;
}

export function voiceRelayHealthUrl(wssUrl: string | null = getVoiceRelayWssUrl()): string | null {
  if (!wssUrl) return null;
  try {
    const url = new URL(wssUrl);
    url.protocol = url.protocol === "ws:" ? "http:" : "https:";
    if (url.pathname.endsWith("/ws")) {
      url.pathname = `${url.pathname.slice(0, -3)}/health`;
    } else {
      const base = url.pathname.replace(/\/$/, "");
      url.pathname = `${base}/health`;
    }
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function decideTwimlGreeting(input: {
  relayHonorsSkipOpening: boolean;
  identityGreeting: string;
  recordingNotice?: string;
}): { welcome: string; skipOpening: boolean } {
  const notice = input.recordingNotice?.trim() ?? "";
  if (input.relayHonorsSkipOpening) {
    const welcome = notice
      ? `${notice} ${input.identityGreeting}`
      : input.identityGreeting;
    return { welcome, skipOpening: true };
  }
  // Old relay will greet itself. Speak only the legal notice so identity
  // is not said twice.
  return { welcome: notice, skipOpening: false };
}

export async function fetchVoiceRelayHealth(opts?: {
  force?: boolean;
}): Promise<VoiceRelayHealth | null> {
  if (!opts?.force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.health;
  }
  const url = voiceRelayHealthUrl();
  if (!url) {
    cache = { at: Date.now(), health: null };
    return null;
  }
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      cache = { at: Date.now(), health: null };
      return null;
    }
    const body = (await res.json()) as { version?: unknown };
    const version = typeof body.version === "string" ? body.version : "";
    const health: VoiceRelayHealth = {
      version,
      honorsSkipOpening: relayHonorsSkipOpening(version),
    };
    cache = { at: Date.now(), health };
    return health;
  } catch {
    cache = { at: Date.now(), health: null };
    return null;
  }
}

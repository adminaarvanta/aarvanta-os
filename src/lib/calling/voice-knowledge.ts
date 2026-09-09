/**
 * What the live voice agent should know — and say — on the first seconds of a call.
 *
 * Generic campaign goals like "Book Meetings" must not become a Knowledge Hub
 * search query (that dumps unrelated docs into the prompt) or a spoken briefing.
 */

const GENERIC_BOOKING_GOAL =
  /^(book(\s+(a|the))?\s+(call|calls|meeting|meetings)|schedule(\s+a)?\s+(call|meeting)|meetings?|discovery(\s+call)?)\.?$/i;

/** Legacy default search string that dumped the first KB hits with no real topic. */
export const LEGACY_DEFAULT_KNOWLEDGE_TOPIC =
  "company overview products services pricing FAQ hours support what we do";

export type VoiceKnowledgeMode = "bare" | "informed";

export function isGenericBookingGoal(raw: string | undefined | null): boolean {
  const t = (raw ?? "").trim();
  if (!t) return true;
  if (t.toLowerCase() === LEGACY_DEFAULT_KNOWLEDGE_TOPIC.toLowerCase()) {
    return true;
  }
  return GENERIC_BOOKING_GOAL.test(t);
}

/** First Knowledge Hub query that is actually about something. Null = do not search. */
export function knowledgeSearchTopic(
  ...candidates: Array<string | undefined | null>
): string | null {
  for (const candidate of candidates) {
    const t = (candidate ?? "").trim();
    if (!t || isGenericBookingGoal(t)) continue;
    if (t.length < 8) continue;
    return t.slice(0, 500);
  }
  return null;
}

export function callBriefingForRelay(
  ...candidates: Array<string | undefined | null>
): string {
  const topic = knowledgeSearchTopic(...candidates);
  return topic ?? "";
}

/** Live spoken company — matches EC2 VOICE_BRAND_NAME. Never a Launch OS site brand. */
export const DEFAULT_SPOKEN_BRAND = "Aarvanta";

export function spokenVoiceBrand(_workspaceBusinessName?: string): string {
  return process.env.VOICE_BRAND_NAME?.trim() || DEFAULT_SPOKEN_BRAND;
}

/** Spoken first name from CRM / display name — never a phone number. */
export function spokenFirstName(raw: string | undefined | null): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const first = t.split(/\s+/)[0] ?? "";
  if (!/^[A-Za-z][A-Za-z.''-]{0,24}$/.test(first)) return "";
  const blocked = new Set([
    "unknown",
    "there",
    "customer",
    "caller",
    "contact",
    "user",
    "lead",
  ]);
  if (blocked.has(first.toLowerCase())) return "";
  return first;
}

/**
 * Immediate TwiML greeting — spoken by ConversationRelay catalog TTS in ~1s.
 * Keep it short; the relay must not greet again (skipOpening).
 */
export function voiceIdentityGreeting(input: {
  direction: string;
  agentName: string;
  brandName: string;
  firstName?: string;
}): string {
  const agent = input.agentName.trim() || "Ava";
  const brand = input.brandName.trim() || "Aarvanta";
  const first = spokenFirstName(input.firstName);
  const outbound = input.direction.toLowerCase().startsWith("outbound");
  if (outbound) {
    const hi = first ? `Hi ${first}` : "Hi";
    return `${hi}, it's ${agent} with ${brand}. Is now okay?`;
  }
  return `Hi, you've reached ${brand} — ${agent} here. What can I help with?`;
}

export function voiceKnowledgeMode(digest: string | undefined | null): VoiceKnowledgeMode {
  return digest?.trim() ? "informed" : "bare";
}

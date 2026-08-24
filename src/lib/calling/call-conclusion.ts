import {
  defaultSlotForCallback,
  extractPromisedAtFromText,
  resolveScheduleSlot,
  snapIsoToWorkingHours,
  type SlotResolveOptions,
} from "@/lib/calling/schedule-slots";
import type {
  CallConclusion,
  CallNextAction,
  CallOutcome,
  CallTranscriptTurn,
  DefaultScheduleSlotId,
} from "@/types/calling-agent";

const NEXT_ACTIONS: CallNextAction[] = [
  "none",
  "qualify_lead",
  "callback",
  "follow_up",
  "meeting",
  "send_info",
];

const OUTCOMES: CallOutcome[] = [
  "meeting_booked",
  "callback_requested",
  "no_answer",
  "voicemail",
  "wrong_number",
  "not_interested",
  "already_using_competitor",
  "need_follow_up",
  "bad_timing",
  "spam",
  "disconnected",
  "busy",
  "failed",
  "completed",
];

export function isCallOutcome(value: string): value is CallOutcome {
  return (OUTCOMES as string[]).includes(value);
}

export function isCallNextAction(value: string): value is CallNextAction {
  return (NEXT_ACTIONS as string[]).includes(value);
}

export function isFailedCallOutcome(outcome?: CallOutcome) {
  return (
    outcome === "no_answer" ||
    outcome === "busy" ||
    outcome === "voicemail" ||
    outcome === "failed" ||
    outcome === "disconnected"
  );
}

export function isCloseOnlyOutcome(outcome?: CallOutcome) {
  return (
    outcome === "not_interested" ||
    outcome === "wrong_number" ||
    outcome === "spam" ||
    outcome === "already_using_competitor"
  );
}

function transcriptBlob(
  turns: Array<Pick<CallTranscriptTurn, "content">>,
  summary?: string
) {
  return `${summary ?? ""} ${turns.map((t) => t.content).join(" ")}`.toLowerCase();
}

export function inferNextAction(
  outcome: CallOutcome,
  text: string
): CallNextAction {
  if (outcome === "meeting_booked") return "meeting";
  if (isCloseOnlyOutcome(outcome)) return "none";
  if (isFailedCallOutcome(outcome)) return "none";

  const wantsInfo =
    /\b(send|email|share)\b/.test(text) &&
    /\b(info|information|details|deck|one-?pager|overview|brochure|pricing)\b/.test(
      text
    );
  const wantsCallback =
    /\b(call back|callback|call me (back|later|tomorrow|monday|tuesday|wednesday|thursday|friday)|another time|not a good time|busy right now)\b/.test(
      text
    );
  const wantsFollowUp = /\bfollow[- ]?up\b/.test(text);
  const interested =
    /\b(interested|sounds good|tell me more|let'?s (do|book)|hot lead|qualify)\b/.test(
      text
    );

  if (outcome === "callback_requested" || outcome === "bad_timing" || wantsCallback) {
    return wantsInfo ? "callback" : "callback";
  }
  if (wantsInfo && !wantsCallback) return "send_info";
  if (outcome === "need_follow_up" || wantsFollowUp) return "follow_up";
  if (interested || /\bqualify/.test(text)) return "qualify_lead";
  return "none";
}

function extractInfoToSend(text: string, explicit?: string) {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed.slice(0, 800);

  const sendMatch = text.match(
    /(?:send|email|share)\s+(?:me\s+)?(?:the\s+)?(.{8,120}?)(?:\.|$)/i
  );
  if (sendMatch?.[1] && /\b(info|detail|deck|overview|pricing|one-?pager)\b/i.test(sendMatch[1])) {
    return sendMatch[1].trim().slice(0, 400);
  }
  return undefined;
}

export function inferCallConclusion(input: {
  outcome?: CallOutcome | string;
  summary?: string;
  turns?: Array<Pick<CallTranscriptTurn, "content" | "role">>;
  nextAction?: CallNextAction | string;
  promisedAt?: string;
  slotId?: DefaultScheduleSlotId | string;
  infoToSend?: string;
  notes?: string;
  slotOptions?: SlotResolveOptions;
}): CallConclusion {
  const rawOutcome = input.outcome ?? "";
  const outcome: CallOutcome = isCallOutcome(rawOutcome) ? rawOutcome : "completed";
  const turns = input.turns ?? [];
  const text = transcriptBlob(turns, input.summary);
  const rawNext = input.nextAction ?? "";
  const nextAction: CallNextAction = isCallNextAction(rawNext)
    ? rawNext
    : inferNextAction(outcome, text);

  const options = input.slotOptions ?? {};
  const timeZone = options.timeZone;
  const now = options.now ?? new Date();

  let promisedAt: string | undefined;
  let slotId: DefaultScheduleSlotId | undefined;

  if (input.promisedAt) {
    const parsed = new Date(input.promisedAt);
    if (!Number.isNaN(parsed.getTime())) {
      promisedAt = snapIsoToWorkingHours(parsed.toISOString(), options);
    }
  }

  if (!promisedAt) {
    const extracted = extractPromisedAtFromText(`${input.summary ?? ""} ${text}`, options);
    if (extracted) {
      promisedAt = extracted.at;
      slotId = extracted.slotId;
    }
  }

  const needsTime =
    nextAction === "callback" ||
    nextAction === "follow_up" ||
    nextAction === "qualify_lead";

  const SLOT_IDS: DefaultScheduleSlotId[] = [
    "next_morning",
    "next_afternoon",
    "in_2_hours",
    "tomorrow_same",
  ];
  if (needsTime && !promisedAt) {
    const fallback: DefaultScheduleSlotId =
      input.slotId && SLOT_IDS.includes(input.slotId as DefaultScheduleSlotId)
        ? (input.slotId as DefaultScheduleSlotId)
        : defaultSlotForCallback(now, timeZone ?? "America/New_York");
    const resolved = resolveScheduleSlot(fallback, options);
    promisedAt = resolved.at;
    slotId = resolved.slotId;
  }

  const notes =
    input.notes?.trim() ||
    input.summary?.trim() ||
    (nextAction === "none" ? `Call ended (${outcome})` : undefined);

  return {
    outcome,
    nextAction,
    promisedAt,
    slotId,
    infoToSend: extractInfoToSend(text, input.infoToSend),
    notes: notes?.slice(0, 500),
  };
}

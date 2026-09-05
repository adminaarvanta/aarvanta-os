import type { CallOutcome, CallSession } from "@/types/calling-agent";

/** Outbound ring with no answer — Twilio default is 60s; allow a short buffer. */
export const RINGING_TIMEOUT_MS = 90_000;

/** `in_progress` with no spoken turns: call never connected or relay never started. */
export const UNCONNECTED_TIMEOUT_MS = 3 * 60_000;

/** Hard cap for any live AI call. */
export const MAX_CALL_DURATION_MS = 20 * 60_000;

/** No new transcript after the last turn — conversation died mid-call. */
export const SILENCE_TIMEOUT_MS = 4 * 60_000;

/** Twilio completed but voice-relay transcript never arrived. */
export const MISSING_TRANSCRIPT_GRACE_MS = 90_000;

/** Demo seed sessions should stay visible while someone is walking the product. */
export const DEMO_SWEEP_MIN_AGE_MS = 30 * 60_000;

export type LiveCallPhase = "ringing" | "connecting" | "live" | "stale";

export type OpenSessionVerdict = {
  stale: boolean;
  outcome: CallOutcome;
  summary: string;
  phase: LiveCallPhase;
};

export function spokenTurnCount(session: Pick<CallSession, "transcript">): number {
  return (session.transcript ?? []).filter(
    (turn) => turn.role !== "system" && Boolean(turn.content?.trim())
  ).length;
}

export function lastActivityMs(session: CallSession): number {
  const turns = session.transcript ?? [];
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    if (!turns[i].at) continue;
    const at = new Date(turns[i].at as string).getTime();
    if (!Number.isNaN(at)) return at;
  }
  const updated = new Date(session.updatedAt).getTime();
  if (!Number.isNaN(updated)) return updated;
  const started = new Date(session.startedAt).getTime();
  return Number.isNaN(started) ? Date.now() : started;
}

export function classifyOpenSession(
  session: CallSession,
  now = Date.now()
): OpenSessionVerdict {
  if (session.status !== "ringing" && session.status !== "in_progress") {
    return { stale: false, outcome: "completed", summary: "", phase: "live" };
  }

  const started = new Date(session.startedAt).getTime();
  const age = Number.isNaN(started) ? 0 : Math.max(0, now - started);
  const spoken = spokenTurnCount(session);
  const idle = Math.max(0, now - lastActivityMs(session));
  const twilioEnded = (session.durationSeconds ?? 0) > 0;

  if (session.status === "ringing") {
    if (age >= RINGING_TIMEOUT_MS) {
      return {
        stale: true,
        outcome: "no_answer",
        summary: "Call never answered and was closed automatically.",
        phase: "stale",
      };
    }
    return { stale: false, outcome: "no_answer", summary: "", phase: "ringing" };
  }

  if (spoken === 0 && twilioEnded && idle >= MISSING_TRANSCRIPT_GRACE_MS) {
    return {
      stale: true,
      outcome: session.outcome ?? "completed",
      summary: "Call ended, but no transcript arrived. Session was closed.",
      phase: "stale",
    };
  }

  if (spoken === 0) {
    if (age >= UNCONNECTED_TIMEOUT_MS) {
      return {
        stale: true,
        outcome: "failed",
        summary: "Call did not connect or never started a conversation.",
        phase: "stale",
      };
    }
    return { stale: false, outcome: "failed", summary: "", phase: "connecting" };
  }

  if (age >= MAX_CALL_DURATION_MS) {
    return {
      stale: true,
      outcome: "disconnected",
      summary: "Call exceeded the maximum duration and was ended.",
      phase: "stale",
    };
  }

  if (idle >= SILENCE_TIMEOUT_MS) {
    return {
      stale: true,
      outcome: "disconnected",
      summary: "Call went silent and was closed automatically.",
      phase: "stale",
    };
  }

  return { stale: false, outcome: "completed", summary: "", phase: "live" };
}

export function connectionNote(session: CallSession, verdict: OpenSessionVerdict): string {
  if (verdict.phase === "ringing") {
    return "Dialing the lead. Transcript appears once they answer.";
  }
  if (verdict.phase === "connecting") {
    return "Line is up. Waiting for the first spoken turn from the AI agent.";
  }
  if (verdict.phase === "stale") {
    return verdict.summary || "This session looks stuck and should be closed.";
  }
  if (spokenTurnCount(session) === 0) {
    return "Connected — waiting for conversation.";
  }
  return "AI agent is on the line.";
}

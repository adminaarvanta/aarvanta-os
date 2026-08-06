import { nextAttemptAtForOutcome } from "@/lib/calling/retry-policy";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { crmNow } from "@/lib/data/crm-helpers";
import type { TenantScope } from "@/types/communication";
import type {
  CallOutcome,
  CallSession,
  CallTranscriptTurn,
  QualificationFlags,
} from "@/types/calling-agent";

export async function finalizeCallSession(input: {
  scope: TenantScope;
  sessionId?: string;
  callSid?: string;
  conversationId?: string;
  turns: CallTranscriptTurn[];
  summary?: string;
  outcome?: CallOutcome;
  sentiment?: CallSession["sentiment"];
  intent?: string;
  intentConfidence?: number;
  qualification?: QualificationFlags;
  callScore?: number;
  currentStage?: CallSession["currentStage"];
  aiDecisions?: string[];
  recordingUrl?: string;
  recordingSid?: string;
  durationSeconds?: number;
}) {
  const repo = getCallingAgentRepository();
  let session: CallSession | null = null;

  if (input.sessionId) {
    session = await repo.getSession(input.sessionId, input.scope);
  }
  if (!session && input.callSid) {
    session = await repo.getSessionByCallSid(input.callSid, input.scope);
  }
  if (!session && input.conversationId) {
    const sessions = await repo.listSessions(input.scope);
    session =
      sessions.find((s) => s.conversationId === input.conversationId) ?? null;
  }

  const outcome =
    input.outcome ??
    inferOutcomeFromTranscript(input.turns, input.summary);

  if (!session) {
    session = await repo.createSession(
      {
        callSid: input.callSid,
        conversationId: input.conversationId,
        status: "completed",
      },
      input.scope
    );
  }

  const endedAt = crmNow();
  const started = new Date(session.startedAt).getTime();
  const durationSeconds =
    input.durationSeconds ??
    Math.max(0, Math.round((Date.now() - started) / 1000));

  const updated = await repo.updateSession(
    session.id,
    {
      status: "completed",
      endedAt,
      durationSeconds,
      transcript: input.turns.length ? input.turns : session.transcript,
      summary: input.summary ?? session.summary,
      outcome,
      sentiment: input.sentiment ?? inferSentiment(input.summary, outcome),
      intent: input.intent,
      intentConfidence: input.intentConfidence,
      qualification: input.qualification ?? session.qualification,
      callScore: input.callScore,
      currentStage: input.currentStage ?? "end_call",
      aiDecisions: input.aiDecisions,
      recordingUrl: input.recordingUrl ?? session.recordingUrl,
      recordingSid: input.recordingSid ?? session.recordingSid,
      callSid: input.callSid ?? session.callSid,
    },
    input.scope
  );

  if (updated?.queueId && outcome) {
    const queueItem = await repo.getQueueItem(updated.queueId, input.scope);
    const campaign = updated.campaignId
      ? await repo.getCampaign(updated.campaignId, input.scope)
      : null;
    if (queueItem && campaign) {
      const next = nextAttemptAtForOutcome(
        outcome,
        campaign.retryPolicy,
        queueItem.attemptCount
      );
      await repo.updateQueueItem(
        queueItem.id,
        {
          status: next.retry ? "pending" : next.status,
          nextAttemptAt: next.nextAttemptAt,
          lastOutcome: outcome,
        },
        input.scope
      );
    }
  }

  return updated;
}

function inferOutcomeFromTranscript(
  turns: CallTranscriptTurn[],
  summary?: string
): CallOutcome {
  const text = `${summary ?? ""} ${turns.map((t) => t.content).join(" ")}`.toLowerCase();
  if (/meeting|booked|calendar|scheduled|see you/.test(text)) {
    return "meeting_booked";
  }
  if (/not interested|no thanks|don't call/.test(text)) {
    return "not_interested";
  }
  if (/call back|busy|another time/.test(text)) {
    return "callback_requested";
  }
  if (/voicemail|leave a message/.test(text)) {
    return "voicemail";
  }
  if (/wrong (number|person)/.test(text)) {
    return "wrong_number";
  }
  return "completed";
}

function inferSentiment(
  summary: string | undefined,
  outcome: CallOutcome
): CallSession["sentiment"] {
  if (outcome === "meeting_booked" || outcome === "callback_requested") {
    return "positive";
  }
  if (
    outcome === "not_interested" ||
    outcome === "spam" ||
    outcome === "wrong_number"
  ) {
    return "negative";
  }
  if (summary && /great|excited|interested|perfect/.test(summary.toLowerCase())) {
    return "positive";
  }
  return "neutral";
}

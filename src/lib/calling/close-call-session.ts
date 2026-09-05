import { applyCallConclusion } from "@/lib/calling/apply-call-conclusion";
import { isFailedCallOutcome } from "@/lib/calling/call-conclusion";
import { syncCallOutcomeToCrm } from "@/lib/calling/crm-sync";
import { finalizeCallSession } from "@/lib/calling/session-outcomes";
import { hangupTwilioCall } from "@/lib/channels/twilio-hangup";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import type { TenantScope } from "@/types/communication";
import type {
  CallOutcome,
  CallSession,
  CallTranscriptTurn,
} from "@/types/calling-agent";

export async function closeCallSession(input: {
  scope: TenantScope;
  session?: CallSession | null;
  sessionId?: string;
  callSid?: string;
  conversationId?: string;
  outcome: CallOutcome;
  summary?: string;
  status?: CallSession["status"];
  hangup?: boolean;
  applySideEffects?: boolean;
  durationSeconds?: number;
  turns?: CallTranscriptTurn[];
}): Promise<CallSession | null> {
  const repo = getCallingAgentRepository();
  let session = input.session ?? null;

  if (!session && input.sessionId) {
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
  if (!session) return null;

  if (session.status === "completed" || session.status === "failed") {
    return session;
  }

  if (input.hangup) {
    await hangupTwilioCall(session.callSid ?? input.callSid);
  }

  const nextStatus =
    input.status ??
    (isFailedCallOutcome(input.outcome) ? "failed" : "completed");

  const updated = await finalizeCallSession({
    scope: input.scope,
    sessionId: session.id,
    callSid: input.callSid ?? session.callSid,
    conversationId: input.conversationId ?? session.conversationId,
    turns: input.turns ?? [],
    summary: input.summary ?? session.summary,
    outcome: input.outcome,
    durationSeconds: input.durationSeconds,
    status: nextStatus,
  });

  if (updated && input.applySideEffects !== false) {
    try {
      await syncCallOutcomeToCrm(updated, input.scope);
    } catch (error) {
      console.warn("[calling] CRM sync after close failed", error);
    }
    try {
      await applyCallConclusion(updated, input.scope);
    } catch (error) {
      console.warn("[calling] conclusion after close failed", error);
    }
  }

  return updated;
}

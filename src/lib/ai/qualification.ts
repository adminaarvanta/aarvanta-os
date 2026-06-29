import { getCrmQualificationThreshold } from "@/lib/ai/config";
import { getWorkspaceSettingsSync } from "@/lib/settings/workspace-settings";
import type { ConversationIntent, TenantScope } from "@/types/communication";

export type QualificationResult = {
  intent: ConversationIntent;
  qualificationScore: number;
};

function thresholdForScope(scope?: TenantScope): number {
  if (scope) {
    return getWorkspaceSettingsSync(scope.workspaceId).crmQualificationThreshold;
  }
  return getCrmQualificationThreshold();
}

export function isQualifiedForCrmLead(
  qualification: QualificationResult,
  scope?: TenantScope
): boolean {
  if (qualification.intent === "spam") return false;
  if (qualification.intent !== "sales") return false;
  return qualification.qualificationScore >= thresholdForScope(scope);
}

export function heuristicQualification(
  transcript: string,
  sentiment: "positive" | "neutral" | "frustrated" | "urgent"
): QualificationResult {
  const lower = transcript.toLowerCase();

  if (
    /\b(unsubscribe|viagra|lottery|nigerian prince|crypto airdrop|click here to claim|you have won|free money)\b/i.test(
      lower
    )
  ) {
    return { intent: "spam", qualificationScore: 0 };
  }

  const salesSignals =
    /\b(pric(e|ing)?|quote|demo|trial|buy|purchase|interested|partnership|proposal|budget|package|subscribe|sign up|book a call|schedule|meeting|onboard|contract)\b/i;
  if (salesSignals.test(lower)) {
    let score = 55;
    if (sentiment === "positive") score += 15;
    if (sentiment === "urgent") score += 10;
    if (sentiment === "frustrated") score += 5;
    return { intent: "sales", qualificationScore: Math.min(100, score) };
  }

  if (
    /\b(help|support|bug|broken|issue|refund|ticket|not working|error)\b/i.test(
      lower
    )
  ) {
    return { intent: "support", qualificationScore: 35 };
  }

  return { intent: "other", qualificationScore: 20 };
}

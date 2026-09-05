import type {
  ConversationStageId,
  FlowStage,
  VoiceAgentFlowConfig,
} from "@/types/calling-agent";

/** What this step is for — shown in the agent editor, not read on the call. */
export const PLAYBOOK_STEP_HINTS: Record<ConversationStageId, string> = {
  greeting: "Open the call and check that now is a good time.",
  permission: "Say why you’re calling before any pitch.",
  qualification: "Learn whether they are a fit (need, timing, decision maker).",
  objection_handling: "Handle pushback briefly, then move on.",
  meeting_proposal: "Offer a short follow-up meeting.",
  day_select: "Agree on a day.",
  slot_select: "Agree on a time. Never invent slots — use calendar tools.",
  booking: "Confirm the meeting and next steps.",
  closing: "Thank them and wrap up.",
  end_call: "End the call politely.",
};

const WHEN_LABELS: Record<string, string> = {
  yes: "they agree",
  no: "they decline",
  busy: "they’re busy",
  wrong_person: "wrong person",
  continue: "they want to continue",
  not_interested: "not interested",
  interested: "they’re interested",
  objection: "they object",
  resolved: "objection is handled",
  day_chosen: "they pick a day",
  slot_chosen: "they pick a time",
  neither: "neither time works",
  booked: "the meeting is booked",
  done: "ready to hang up",
};

export function playbookWhenLabel(when: string): string {
  return WHEN_LABELS[when] ?? when.replace(/_/g, " ");
}

export function playbookNextLabel(stageId: string, stages: FlowStage[]): string {
  const match = stages.find((s) => s.id === stageId);
  return match?.label ?? stageId.replace(/_/g, " ");
}

/** Compact playbook for the live-call LLM — coaching notes, not a teleprompter. */
export function formatPlaybookForRelay(flow: VoiceAgentFlowConfig): string {
  if (!flow?.stages?.length) return "";
  return flow.stages
    .map((stage, index) => {
      const next =
        stage.transitions.length === 0
          ? "Then end the call."
          : `Then: ${stage.transitions
              .map(
                (t) =>
                  `if ${playbookWhenLabel(t.when)} → ${playbookNextLabel(t.to, flow.stages)}`
              )
              .join("; ")}.`;
      const example = stage.samplePrompt?.trim()
        ? ` Example line (paraphrase, never recite): "${stage.samplePrompt.trim()}"`
        : "";
      return `${index + 1}. ${stage.label} — ${stage.objective.trim()}${example} ${next}`;
    })
    .join("\n");
}

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

/** How to sound on a live call — always on, even when a knowledge base exists. */
export const HUMAN_CALL_STYLE = [
  "HOW TO TALK (this is a phone call, not a webpage):",
  "- Sound like a real person: contractions, short sentences, one idea then stop.",
  "- React to the last thing they said before you add anything new.",
  "- No lists, no markdown, no feature dump, no 'as I mentioned', no script recitation.",
  "- If they are busy, not interested, or the wrong person: accept it and close. Do not keep pitching.",
].join("\n");

/** Always-on manners when the workspace has no company copy or knowledge base. */
export const BARE_CALL_MANNERS = [
  "MANNERS AND SIMPLE OBJECTIONS:",
  "- Ask if now is a good time. One question at a time.",
  "- Busy: offer a callback and close. Not interested: accept and hang up.",
  "- Wrong person: apologize and end.",
  "- If they ask what this is about: a short intro or follow-up — do not invent a product, price, customer, or feature.",
  "- If they ask for details you do not have: say so and offer a human follow-up. Take an email if they want something sent.",
].join("\n");

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
      return `${index + 1}. ${stage.label} — ${stage.objective.trim()} ${next}`;
    })
    .join("\n");
}

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
  "HOW TO TALK — you are a marketing person, not a robot:",
  "- Greet first, then keep the energy going with a light hook, then converse.",
  "- Sound like a real human: contractions, easy rhythm, a little warmth. 'Yeah', 'got it', 'totally fair', 'I'll keep this quick' are good.",
  "- Curious, not pushy. Two short spoken sentences, then listen.",
  "- No lists, no markdown, no feature dump, no interrogation, no 'as I mentioned'.",
  "- If they bite on the hook, talk with them. If they are busy or not interested, be gracious and close.",
].join("\n");

/** Always-on manners when the workspace has no company copy or knowledge base. */
export const BARE_CALL_MANNERS = [
  "MANNERS AND SIMPLE OBJECTIONS:",
  "- After the greeting, a simple hook: you're calling for a quick intro or follow-up, and you wanted to see if it's even relevant.",
  "- Do not invent a product, price, customer, or feature.",
  "- Busy: 'totally get it — I can try you another time' and close.",
  "- Not interested: 'fair enough, I'll let you go' and hang up.",
  "- Wrong person: apologize and end.",
  "- If they want details you do not have: say so and offer a human follow-up. Take an email if they want something sent.",
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

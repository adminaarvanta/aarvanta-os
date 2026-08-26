export const AUTOMATION_PRESET_IDS = [
  "schedule_team_call",
  "ai_voice_followup",
  "new_lead_chase",
  "missed_call_callback",
  "quiet_deal_followup",
  "deal_won_next_steps",
] as const;

export type AutomationPresetId = (typeof AUTOMATION_PRESET_IDS)[number];

/** These keep running in the background when Automatic is on. The rest only run when you ask. */
export const AUTOMATION_BACKGROUND_IDS = [
  "new_lead_chase",
  "missed_call_callback",
  "quiet_deal_followup",
  "deal_won_next_steps",
] as const;

export function isAutomationBackground(templateId?: string | null): boolean {
  return Boolean(
    templateId &&
      (AUTOMATION_BACKGROUND_IDS as readonly string[]).includes(templateId)
  );
}

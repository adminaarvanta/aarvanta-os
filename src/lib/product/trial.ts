/**
 * Single source of truth for trial / free-plan language.
 * There is no Stripe trial period in the billing catalog — do not advertise days.
 */
export const TRIAL_POLICY = {
  kind: "free_plan" as const,
  copy: "Free plan — no card required",
  shortCopy: "Start free. No card required.",
};

export function trialCopy(): string {
  return TRIAL_POLICY.copy;
}

import type { MemberCreditOverrides } from "@/types/tenant";

export const EMPTY_MEMBER_CREDIT_OVERRIDES: MemberCreditOverrides = {
  unlimitedVoice: false,
  unlimitedEmailOutreach: false,
};

export function normalizeMemberCreditOverrides(
  overrides?: MemberCreditOverrides | null
): MemberCreditOverrides {
  return {
    unlimitedVoice: Boolean(overrides?.unlimitedVoice),
    unlimitedEmailOutreach: Boolean(overrides?.unlimitedEmailOutreach),
  };
}

export function mergeMemberCreditOverrides(
  ...parts: Array<MemberCreditOverrides | null | undefined>
): MemberCreditOverrides {
  return {
    unlimitedVoice: parts.some((p) => p?.unlimitedVoice),
    unlimitedEmailOutreach: parts.some((p) => p?.unlimitedEmailOutreach),
  };
}

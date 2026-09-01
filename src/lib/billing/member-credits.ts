import type { Entitlements } from "@/lib/billing/entitlements";
import { isSuperAdminEmail } from "@/lib/billing/super-admin";
import type { MemberCreditOverrides, WorkspaceMember } from "@/types/tenant";

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

export function creditOverridesFromMember(
  member: WorkspaceMember | null | undefined
): MemberCreditOverrides {
  return normalizeMemberCreditOverrides(member?.creditOverrides);
}

export function hasUnlimitedVoice(
  entitlements: Pick<Entitlements, "isSuperAdmin" | "creditOverrides">
): boolean {
  return (
    entitlements.isSuperAdmin || Boolean(entitlements.creditOverrides.unlimitedVoice)
  );
}

export function hasUnlimitedEmailOutreach(
  entitlements: Pick<Entitlements, "isSuperAdmin" | "creditOverrides">
): boolean {
  return (
    entitlements.isSuperAdmin ||
    Boolean(entitlements.creditOverrides.unlimitedEmailOutreach)
  );
}

export function canAccessEmailOutreachForMember(
  email: string | null | undefined,
  member: WorkspaceMember | null | undefined,
  isDemo: boolean
): boolean {
  if (isDemo) return true;
  if (isSuperAdminEmail(email)) return true;
  return Boolean(member?.creditOverrides?.unlimitedEmailOutreach);
}

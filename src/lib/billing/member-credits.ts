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

export function mergeMemberCreditOverrides(
  ...parts: Array<MemberCreditOverrides | null | undefined>
): MemberCreditOverrides {
  return {
    unlimitedVoice: parts.some((p) => p?.unlimitedVoice),
    unlimitedEmailOutreach: parts.some((p) => p?.unlimitedEmailOutreach),
  };
}

export function creditOverridesFromMember(
  member: WorkspaceMember | null | undefined
): MemberCreditOverrides {
  return normalizeMemberCreditOverrides(member?.creditOverrides);
}

export function creditOverridesFromMemberships(
  memberships: WorkspaceMember[]
): MemberCreditOverrides {
  return mergeMemberCreditOverrides(
    ...memberships.map((m) => m.creditOverrides)
  );
}

/**
 * Resolve grants from the current membership, falling back to every
 * membership for this email (covers userId/scope mismatches).
 */
export async function resolveCreditOverridesForSession(input: {
  email: string | null | undefined;
  member: WorkspaceMember | null | undefined;
}): Promise<MemberCreditOverrides> {
  const fromMember = creditOverridesFromMember(input.member);
  if (fromMember.unlimitedVoice && fromMember.unlimitedEmailOutreach) {
    return fromMember;
  }

  const email = input.email?.trim().toLowerCase();
  if (!email) return fromMember;

  try {
    const { getTenantRepository } = await import("@/lib/data/tenant-store");
    const memberships = await getTenantRepository().listMembershipsForEmail(
      email
    );
    return mergeMemberCreditOverrides(
      fromMember,
      creditOverridesFromMemberships(memberships)
    );
  } catch {
    return fromMember;
  }
}

/**
 * Attach merged credit overrides onto the session member so Email OS /
 * entitlements see grants even when they live on a sibling membership.
 */
export async function withResolvedCreditOverrides(
  email: string,
  member: WorkspaceMember | null
): Promise<WorkspaceMember | null> {
  const overrides = await resolveCreditOverridesForSession({ email, member });

  if (member) {
    return {
      ...member,
      creditOverrides: overrides,
    };
  }

  if (!overrides.unlimitedVoice && !overrides.unlimitedEmailOutreach) {
    return null;
  }

  // No scoped membership — still surface grants via any active membership
  // for this email so Email OS nav/access checks can pass.
  try {
    const { getTenantRepository } = await import("@/lib/data/tenant-store");
    const memberships = await getTenantRepository().listMembershipsForEmail(
      email
    );
    const any =
      memberships.find((m) => m.status === "active") ?? memberships[0] ?? null;
    if (!any) return null;
    return { ...any, creditOverrides: overrides };
  } catch {
    return null;
  }
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

import type { Entitlements } from "@/lib/billing/entitlements";
import {
  getCreditOverridesForEmail,
  setCreditOverridesForEmail,
} from "@/lib/billing/credit-grant-store";
import {
  mergeMemberCreditOverrides,
  normalizeMemberCreditOverrides,
} from "@/lib/billing/credit-override-utils";
import { isSuperAdminEmail } from "@/lib/billing/super-admin";
import type { MemberCreditOverrides, WorkspaceMember } from "@/types/tenant";

export {
  EMPTY_MEMBER_CREDIT_OVERRIDES,
  mergeMemberCreditOverrides,
  normalizeMemberCreditOverrides,
} from "@/lib/billing/credit-override-utils";

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

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Find active memberships for an email. Firestore equality is case-sensitive,
 * so fall back to a full member scan when the indexed query misses.
 */
export async function findMembershipsByEmail(
  email: string
): Promise<WorkspaceMember[]> {
  const key = emailKey(email);
  if (!key) return [];

  const { getTenantRepository } = await import("@/lib/data/tenant-store");
  const repo = getTenantRepository();

  const direct = await repo.listMembershipsForEmail(email);
  const directMatched = direct.filter(
    (m) => m.status === "active" && emailKey(m.email) === key
  );
  if (directMatched.length > 0) return directMatched;

  const all = await repo.listAllMembers();
  return all.filter(
    (m) => m.status === "active" && emailKey(m.email) === key
  );
}

/**
 * Resolve grants for the signed-in user.
 * Reads email-keyed `member_credit_grants` plus every membership for the email.
 * Memberships remain durable; the grant store is a fast email index.
 */
export async function resolveCreditOverridesForSession(input: {
  email: string | null | undefined;
  member: WorkspaceMember | null | undefined;
}): Promise<MemberCreditOverrides> {
  const fromMember = creditOverridesFromMember(input.member);
  const fromStore = await getCreditOverridesForEmail(input.email);
  let merged = mergeMemberCreditOverrides(fromStore, fromMember);

  const email = input.email?.trim();
  if (!email) return merged;

  // Only skip membership lookup when both grants are already present.
  if (!(merged.unlimitedVoice && merged.unlimitedEmailOutreach)) {
    try {
      const memberships = await findMembershipsByEmail(email);
      merged = mergeMemberCreditOverrides(
        merged,
        creditOverridesFromMemberships(memberships)
      );
    } catch {
      /* keep merged */
    }
  }

  // Write-through: migrate membership-only grants into the email-keyed store.
  if (
    (merged.unlimitedVoice || merged.unlimitedEmailOutreach) &&
    !fromStore.unlimitedVoice &&
    !fromStore.unlimitedEmailOutreach
  ) {
    void setCreditOverridesForEmail(email, merged).catch(() => {
      /* best-effort */
    });
  }

  return merged;
}

/**
 * Persist a grant: update every membership for the email (durable), then the
 * email-keyed grant store (index). Membership writes are required to succeed
 * when memberships exist — the store is best-effort.
 */
export async function saveCreditOverridesForEmail(input: {
  email: string;
  overrides: MemberCreditOverrides;
  updatedBy?: string;
}): Promise<MemberCreditOverrides> {
  const normalized = normalizeMemberCreditOverrides(input.overrides);
  const key = emailKey(input.email);

  const { getTenantRepository } = await import("@/lib/data/tenant-store");
  const repo = getTenantRepository();
  const all = await repo.listAllMembers();
  const siblings = all.filter(
    (m) => m.status === "active" && emailKey(m.email) === key
  );

  if (siblings.length > 0) {
    const results = await Promise.all(
      siblings.map((member) =>
        repo.updateMemberCreditOverrides(member.id, normalized, {
          tenantId: member.tenantId,
          workspaceId: member.workspaceId,
          companyId: member.companyId,
        })
      )
    );
    if (results.every((row) => row == null)) {
      throw new Error("Could not update membership credit overrides.");
    }
  }

  try {
    await setCreditOverridesForEmail(
      input.email,
      normalized,
      input.updatedBy
    );
  } catch (error) {
    console.warn(
      "[credit-grants] email store write failed after membership update",
      error instanceof Error ? error.message : error
    );
  }

  return normalized;
}

/**
 * Attach resolved grants onto the session member so sync access checks work.
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

  try {
    const memberships = await findMembershipsByEmail(email);
    const any =
      memberships.find((m) => m.status === "active") ?? memberships[0] ?? null;
    if (any) {
      return { ...any, creditOverrides: overrides };
    }
  } catch {
    /* fall through to stub */
  }

  return {
    id: `grant_${emailKey(email)}`,
    tenantId: "grant",
    workspaceId: "grant",
    companyId: "grant",
    userId: `user_${emailKey(email)
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 40)}`,
    email: emailKey(email),
    name: email.split("@")[0] || "User",
    role: "member",
    status: "active",
    creditOverrides: overrides,
    joinedAt: new Date(0).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function hasUnlimitedVoice(
  entitlements: Pick<Entitlements, "isSuperAdmin" | "creditOverrides">
): boolean {
  return (
    entitlements.isSuperAdmin ||
    Boolean(entitlements.creditOverrides.unlimitedVoice)
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

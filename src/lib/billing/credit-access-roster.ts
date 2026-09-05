import {
  listCreditGrantOverrides,
} from "@/lib/billing/credit-grant-store";
import {
  normalizeMemberCreditOverrides,
  saveCreditOverridesForEmail,
} from "@/lib/billing/member-credits";
import type { TenantRepository } from "@/lib/data/tenant-repository";
import type { MemberCreditOverrides, MemberRole, WorkspaceMember } from "@/types/tenant";

export type CreditAccessRosterEntry = {
  /** Representative membership id used for PATCH. */
  id: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  organizationName: string;
  workspaceName: string;
  membershipCount: number;
  creditOverrides: {
    unlimitedVoice: boolean;
    unlimitedEmailOutreach: boolean;
  };
};

const ROLE_RANK: Record<MemberRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  member: 2,
  guest: 1,
};

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

function pickRepresentative(candidates: WorkspaceMember[]): WorkspaceMember {
  return [...candidates].sort((a, b) => {
    const aGrant =
      Number(Boolean(a.creditOverrides?.unlimitedVoice)) +
      Number(Boolean(a.creditOverrides?.unlimitedEmailOutreach));
    const bGrant =
      Number(Boolean(b.creditOverrides?.unlimitedVoice)) +
      Number(Boolean(b.creditOverrides?.unlimitedEmailOutreach));
    if (bGrant !== aGrant) return bGrant - aGrant;
    if (ROLE_RANK[b.role] !== ROLE_RANK[a.role]) {
      return ROLE_RANK[b.role] - ROLE_RANK[a.role];
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  })[0]!;
}

function mergedOverrides(candidates: WorkspaceMember[]): MemberCreditOverrides {
  return {
    unlimitedVoice: candidates.some((m) => m.creditOverrides?.unlimitedVoice),
    unlimitedEmailOutreach: candidates.some(
      (m) => m.creditOverrides?.unlimitedEmailOutreach
    ),
  };
}

/**
 * Platform-wide unique product users (by email) for the super-admin
 * credit access panel.
 */
export async function buildCreditAccessRoster(
  repo: TenantRepository
): Promise<CreditAccessRosterEntry[]> {
  const [members, organizations, grantMap] = await Promise.all([
    repo.listAllMembers(),
    repo.listOrganizations(),
    listCreditGrantOverrides(),
  ]);
  const workspaceLists = await Promise.all(
    organizations.map((org) => repo.listWorkspaces(org.id))
  );
  const workspaces = workspaceLists.flat();

  const orgById = new Map(organizations.map((o) => [o.id, o.name]));
  const workspaceById = new Map(workspaces.map((w) => [w.id, w.name]));

  const byEmail = new Map<string, WorkspaceMember[]>();
  for (const member of members) {
    if (member.status !== "active") continue;
    const key = emailKey(member.email);
    if (!key) continue;
    const list = byEmail.get(key) ?? [];
    list.push(member);
    byEmail.set(key, list);
  }

  // Include emails that only exist in the grant store (edge cases).
  for (const [key] of grantMap) {
    if (!byEmail.has(key)) byEmail.set(key, []);
  }

  const roster: CreditAccessRosterEntry[] = [];
  for (const [key, group] of byEmail.entries()) {
    const fromStore = grantMap.get(key);
    const fromMembers = normalizeMemberCreditOverrides(mergedOverrides(group));
    const overrides = normalizeMemberCreditOverrides({
      unlimitedVoice:
        Boolean(fromStore?.unlimitedVoice) || fromMembers.unlimitedVoice,
      unlimitedEmailOutreach:
        Boolean(fromStore?.unlimitedEmailOutreach) ||
        fromMembers.unlimitedEmailOutreach,
    });

    if (group.length === 0) {
      // Grant-only row (no membership doc) — still show so super admin can clear.
      roster.push({
        id: `grant_${key}`,
        userId: `user_${key.replace(/[^a-z0-9]+/g, "_").slice(0, 40)}`,
        name: key.split("@")[0] || key,
        email: key,
        role: "member",
        organizationName: "—",
        workspaceName: "—",
        membershipCount: 0,
        creditOverrides: {
          unlimitedVoice: Boolean(overrides.unlimitedVoice),
          unlimitedEmailOutreach: Boolean(overrides.unlimitedEmailOutreach),
        },
      });
      continue;
    }

    const representative = pickRepresentative(group);
    roster.push({
      id: representative.id,
      userId: representative.userId,
      name: representative.name,
      email: representative.email,
      role: representative.role,
      organizationName:
        orgById.get(representative.tenantId) ?? representative.tenantId,
      workspaceName:
        workspaceById.get(representative.workspaceId) ??
        representative.workspaceId,
      membershipCount: group.length,
      creditOverrides: {
        unlimitedVoice: Boolean(overrides.unlimitedVoice),
        unlimitedEmailOutreach: Boolean(overrides.unlimitedEmailOutreach),
      },
    });
  }

  return roster.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Apply credit overrides by email (memberships + email-keyed grant store).
 */
export async function applyCreditOverridesForEmail(
  repo: TenantRepository,
  memberId: string,
  overrides: MemberCreditOverrides,
  updatedBy?: string
): Promise<WorkspaceMember | null> {
  const all = await repo.listAllMembers();
  const target =
    all.find((m) => m.id === memberId) ??
    (memberId.startsWith("grant_")
      ? ({
          id: memberId,
          email: memberId.slice("grant_".length),
          tenantId: "grant",
          workspaceId: "grant",
          companyId: "grant",
          userId: memberId,
          name: memberId.slice("grant_".length),
          role: "member" as const,
          status: "active" as const,
          joinedAt: new Date(0).toISOString(),
          updatedAt: new Date().toISOString(),
        } satisfies WorkspaceMember)
      : null);
  if (!target?.email) return null;

  const saved = await saveCreditOverridesForEmail({
    email: target.email,
    overrides,
    updatedBy,
  });

  if (target.id.startsWith("grant_")) {
    return {
      ...target,
      creditOverrides: normalizeMemberCreditOverrides(saved),
    };
  }

  const refreshed = await repo.getMember(target.id, {
    tenantId: target.tenantId,
    workspaceId: target.workspaceId,
    companyId: target.companyId,
  });
  if (refreshed) {
    return {
      ...refreshed,
      creditOverrides: normalizeMemberCreditOverrides(saved),
    };
  }
  return {
    ...target,
    creditOverrides: normalizeMemberCreditOverrides(saved),
  };
}

import { normalizeMemberCreditOverrides } from "@/lib/billing/member-credits";
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

/** Prefer memberships that already have grants, then higher roles, then newer. */
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
  const [members, organizations] = await Promise.all([
    repo.listAllMembers(),
    repo.listOrganizations(),
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

  const roster: CreditAccessRosterEntry[] = [];
  for (const group of byEmail.values()) {
    const representative = pickRepresentative(group);
    const overrides = normalizeMemberCreditOverrides(mergedOverrides(group));
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
 * Apply credit overrides to every active membership for this person
 * (same email), so grants work in any workspace they sign into.
 */
export async function applyCreditOverridesForEmail(
  repo: TenantRepository,
  memberId: string,
  overrides: MemberCreditOverrides
): Promise<WorkspaceMember | null> {
  const all = await repo.listAllMembers();
  const target = all.find((m) => m.id === memberId);
  if (!target) return null;

  const key = emailKey(target.email);
  const siblings = all.filter(
    (m) => m.status === "active" && emailKey(m.email) === key
  );

  let primary: WorkspaceMember | null = null;
  for (const member of siblings) {
    const updated = await repo.updateMemberCreditOverrides(
      member.id,
      overrides,
      {
        tenantId: member.tenantId,
        workspaceId: member.workspaceId,
        companyId: member.companyId,
      }
    );
    if (member.id === memberId) primary = updated;
    else if (!primary) primary = updated;
  }
  return primary;
}

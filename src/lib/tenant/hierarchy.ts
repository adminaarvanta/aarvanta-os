import { permissionsForRole, PERMISSION_LABELS } from "@/lib/tenant/permissions";
import type {
  Invitation,
  MemberRole,
  Organization,
  OrganizationHierarchy,
  OrgWorkspaceBranch,
  Workspace,
  WorkspaceMember,
} from "@/types/tenant";
import { MEMBER_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/types/tenant";

function emptyRoleBuckets(): Record<MemberRole, WorkspaceMember[]> {
  return {
    owner: [],
    admin: [],
    manager: [],
    member: [],
    guest: [],
  };
}

export function buildOrganizationHierarchy(input: {
  organization: Organization;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  invitations: Invitation[];
}): OrganizationHierarchy {
  const workspaces: OrgWorkspaceBranch[] = input.workspaces.map((workspace) => {
    const members = input.members
      .filter((m) => m.workspaceId === workspace.id && m.status === "active")
      .sort((a, b) => {
        const rank = (role: MemberRole) => MEMBER_ROLES.indexOf(role);
        const byRole = rank(a.role) - rank(b.role);
        return byRole !== 0 ? byRole : a.name.localeCompare(b.name);
      });

    const membersByRole = emptyRoleBuckets();
    for (const member of members) {
      membersByRole[member.role].push(member);
    }

    const invitations = input.invitations
      .filter((i) => i.workspaceId === workspace.id && i.status === "pending")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return { workspace, members, membersByRole, invitations };
  });

  return {
    organization: input.organization,
    workspaces,
    totalMembers: input.members.filter((m) => m.status === "active").length,
    pendingInvitations: input.invitations.filter((i) => i.status === "pending")
      .length,
  };
}

export function roleCatalog() {
  return MEMBER_ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    description: ROLE_DESCRIPTIONS[role],
    permissions: permissionsForRole(role).map((p) => ({
      id: p,
      label: PERMISSION_LABELS[p],
    })),
  }));
}

import type { TenantScope } from "@/types/communication";

/** Workspace member roles — RBAC foundation */
export type MemberRole = "owner" | "admin" | "manager" | "member" | "guest";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type MemberStatus = "active" | "suspended";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "enterprise";
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  defaultCompanyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember extends TenantScope {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  updatedAt: string;
}

export interface Invitation extends TenantScope {
  id: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  invitedByName: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export const MEMBER_ROLES: MemberRole[] = [
  "owner",
  "admin",
  "manager",
  "member",
  "guest",
];

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  guest: "Guest",
};

/** PRD Multi-Tenant Architecture — human role descriptions. */
export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: "Full control of the organization, billing, and every workspace.",
  admin: "Manage workspaces, members, and all operating modules.",
  manager: "Lead teams, invite people, and run day-to-day operations.",
  member: "Contribute across CRM, finance views, and AI workforce tools.",
  guest: "Limited read access — ideal for contractors and external partners.",
};

/** Hierarchy: Organization → Workspace → Members (by role) + Invitations. */
export type OrgWorkspaceBranch = {
  workspace: Workspace;
  members: WorkspaceMember[];
  membersByRole: Record<MemberRole, WorkspaceMember[]>;
  invitations: Invitation[];
};

export type OrganizationHierarchy = {
  organization: Organization;
  workspaces: OrgWorkspaceBranch[];
  totalMembers: number;
  pendingInvitations: number;
};

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

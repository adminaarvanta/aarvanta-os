import type { TenantScope } from "@/types/communication";
import type {
  Invitation,
  MemberRole,
  Organization,
  Workspace,
  WorkspaceMember,
} from "@/types/tenant";

export type CreateInvitationInput = {
  email: string;
  role: MemberRole;
  workspaceId: string;
  invitedBy: string;
  invitedByName: string;
};

export interface TenantRepository {
  listOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | null>;
  upsertOrganization(org: Organization): Promise<Organization>;
  updateOrganization(
    id: string,
    patch: Partial<Pick<Organization, "name" | "plan">>
  ): Promise<Organization | null>;

  listWorkspaces(tenantId: string): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | null>;
  upsertWorkspace(workspace: Workspace): Promise<Workspace>;
  createWorkspace(
    input: Pick<Workspace, "tenantId" | "name" | "slug" | "defaultCompanyId">
  ): Promise<Workspace>;
  updateWorkspace(
    id: string,
    patch: Partial<Pick<Workspace, "name" | "slug">>
  ): Promise<Workspace | null>;

  listMembers(scope: TenantScope): Promise<WorkspaceMember[]>;
  getMember(id: string, scope: TenantScope): Promise<WorkspaceMember | null>;
  getMemberByUser(
    userId: string,
    scope: TenantScope
  ): Promise<WorkspaceMember | null>;
  updateMemberRole(
    id: string,
    role: MemberRole,
    scope: TenantScope
  ): Promise<WorkspaceMember | null>;
  removeMember(id: string, scope: TenantScope): Promise<boolean>;

  listInvitations(scope: TenantScope): Promise<Invitation[]>;
  createInvitation(
    input: CreateInvitationInput,
    scope: TenantScope
  ): Promise<Invitation>;
  revokeInvitation(id: string, scope: TenantScope): Promise<boolean>;
  acceptInvitation(token: string): Promise<Invitation | null>;

  listMembershipsForUser(userId: string): Promise<WorkspaceMember[]>;
  createMember(
    input: CreateMemberInput,
    scope: TenantScope
  ): Promise<WorkspaceMember>;
}

export type CreateMemberInput = {
  userId: string;
  email: string;
  name: string;
  role: MemberRole;
};

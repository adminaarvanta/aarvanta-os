import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import {
  buildDemoInvitationSeed,
  buildDemoMemberSeed,
  buildDemoOrganizationSeed,
  buildDemoWorkspaceSeed,
} from "@/lib/data/tenant-demo-seed";
import type {
  CreateInvitationInput,
  CreateMemberInput,
  TenantRepository,
} from "@/lib/data/tenant-repository";
import type { TenantScope } from "@/types/communication";
import type { MemberRole } from "@/types/tenant";

let organizations = buildDemoOrganizationSeed();
let workspaces = buildDemoWorkspaceSeed();
let members = buildDemoMemberSeed();
let invitations = buildDemoInvitationSeed();

export const tenantMemoryRepository: TenantRepository = {
  async listOrganizations() {
    return [...organizations].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getOrganization(id) {
    return organizations.find((o) => o.id === id) ?? null;
  },

  async updateOrganization(id, patch) {
    const idx = organizations.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    organizations[idx] = {
      ...organizations[idx],
      ...patch,
      updatedAt: crmNow(),
    };
    return organizations[idx];
  },

  async listWorkspaces(tenantId) {
    return workspaces
      .filter((w) => w.tenantId === tenantId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getWorkspace(id) {
    return workspaces.find((w) => w.id === id) ?? null;
  },

  async createWorkspace(input) {
    const now = crmNow();
    const workspace = {
      ...input,
      id: crmNewId("ws"),
      createdAt: now,
      updatedAt: now,
    };
    workspaces.push(workspace);
    return workspace;
  },

  async updateWorkspace(id, patch) {
    const idx = workspaces.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    workspaces[idx] = { ...workspaces[idx], ...patch, updatedAt: crmNow() };
    return workspaces[idx];
  },

  async listMembers(scope) {
    return members
      .filter((m) => inCrmScope(m, scope))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getMember(id, scope) {
    const item = members.find((m) => m.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async getMemberByUser(userId, scope) {
    return (
      members.find(
        (m) => m.userId === userId && inCrmScope(m, scope) && m.status === "active"
      ) ?? null
    );
  },

  async updateMemberRole(id, role, scope) {
    const idx = members.findIndex((m) => m.id === id && inCrmScope(m, scope));
    if (idx === -1) return null;
    if (members[idx].role === "owner" && role !== "owner") {
      const owners = members.filter(
        (m) => inCrmScope(m, scope) && m.role === "owner" && m.id !== id
      );
      if (owners.length === 0) return null;
    }
    members[idx] = { ...members[idx], role, updatedAt: crmNow() };
    return members[idx];
  },

  async removeMember(id, scope) {
    const member = await this.getMember(id, scope);
    if (!member || member.role === "owner") return false;
    const idx = members.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    members.splice(idx, 1);
    return true;
  },

  async listInvitations(scope) {
    return invitations
      .filter((i) => inCrmScope(i, scope))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async createInvitation(input: CreateInvitationInput, scope) {
    const now = crmNow();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const invitation = {
      ...scope,
      ...input,
      id: crmNewId("inv"),
      token: crmNewId("tok"),
      status: "pending" as const,
      expiresAt,
      createdAt: now,
    };
    invitations.unshift(invitation);
    return invitation;
  },

  async revokeInvitation(id, scope) {
    const idx = invitations.findIndex(
      (i) => i.id === id && inCrmScope(i, scope) && i.status === "pending"
    );
    if (idx === -1) return false;
    invitations[idx] = { ...invitations[idx], status: "revoked" };
    return true;
  },

  async acceptInvitation(token) {
    const idx = invitations.findIndex(
      (i) => i.token === token && i.status === "pending"
    );
    if (idx === -1) return null;
    if (new Date(invitations[idx].expiresAt).getTime() < Date.now()) {
      invitations[idx] = { ...invitations[idx], status: "expired" };
      return null;
    }
    invitations[idx] = { ...invitations[idx], status: "accepted" };
    return invitations[idx];
  },

  async listMembershipsForUser(userId) {
    return members.filter((m) => m.userId === userId && m.status === "active");
  },

  async createMember(input, scope) {
    const existing = members.find(
      (m) =>
        m.userId === input.userId &&
        inCrmScope(m, scope) &&
        m.status === "active"
    );
    if (existing) return existing;

    const now = crmNow();
    const member = {
      ...scope,
      id: crmNewId("member"),
      userId: input.userId,
      email: input.email,
      name: input.name,
      role: input.role,
      status: "active" as const,
      joinedAt: now,
      updatedAt: now,
    };
    members.push(member);
    return member;
  },
};

export function resetTenantMemory() {
  organizations = buildDemoOrganizationSeed();
  workspaces = buildDemoWorkspaceSeed();
  members = buildDemoMemberSeed();
  invitations = buildDemoInvitationSeed();
}

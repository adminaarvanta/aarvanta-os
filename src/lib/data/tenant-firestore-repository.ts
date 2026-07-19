import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type {
  CreateInvitationInput,
  TenantRepository,
} from "@/lib/data/tenant-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { Invitation, Organization, Workspace, WorkspaceMember } from "@/types/tenant";

const ORGS = "tenant_organizations";
const WORKSPACES = "tenant_workspaces";
const MEMBERS = "tenant_members";
const INVITATIONS = "tenant_invitations";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listMembersScoped(scope: TenantScope): Promise<WorkspaceMember[]> {
  const snap = await getDb()
    .collection(MEMBERS)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as WorkspaceMember);
}

export const tenantFirestoreRepository: TenantRepository = {
  async listOrganizations() {
    const snap = await getDb().collection(ORGS).get();
    return snap.docs
      .map((doc) => doc.data() as Organization)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getOrganization(id) {
    const snap = await getDb().collection(ORGS).doc(id).get();
    return snap.exists ? (snap.data() as Organization) : null;
  },

  async updateOrganization(id, patch) {
    const existing = await this.getOrganization(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    await getDb().collection(ORGS).doc(id).set(updated);
    return updated;
  },

  async upsertOrganization(org) {
    const existing = await this.getOrganization(org.id);
    const updated = {
      ...(existing ?? org),
      ...org,
      updatedAt: crmNow(),
    };
    await getDb().collection(ORGS).doc(org.id).set(updated);
    return updated;
  },

  async listWorkspaces(tenantId) {
    const snap = await getDb()
      .collection(WORKSPACES)
      .where("tenantId", "==", tenantId)
      .get();
    return snap.docs
      .map((doc) => doc.data() as Workspace)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getWorkspace(id) {
    const snap = await getDb().collection(WORKSPACES).doc(id).get();
    return snap.exists ? (snap.data() as Workspace) : null;
  },

  async createWorkspace(input) {
    const now = crmNow();
    const workspace: Workspace = {
      ...input,
      id: crmNewId("ws"),
      createdAt: now,
      updatedAt: now,
    };
    await getDb().collection(WORKSPACES).doc(workspace.id).set(workspace);
    return workspace;
  },

  async upsertWorkspace(workspace) {
    const existing = await this.getWorkspace(workspace.id);
    const updated: Workspace = {
      ...(existing ?? workspace),
      ...workspace,
      updatedAt: crmNow(),
    };
    await getDb().collection(WORKSPACES).doc(workspace.id).set(updated);
    return updated;
  },

  async updateWorkspace(id, patch) {
    const existing = await this.getWorkspace(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    await getDb().collection(WORKSPACES).doc(id).set(updated);
    return updated;
  },

  async listMembers(scope) {
    const items = await listMembersScoped(scope);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },

  async listMembersByTenant(tenantId) {
    const snap = await getDb()
      .collection(MEMBERS)
      .where("tenantId", "==", tenantId)
      .get();
    return snap.docs
      .map((doc) => doc.data() as WorkspaceMember)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getMember(id, scope) {
    const snap = await getDb().collection(MEMBERS).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as WorkspaceMember;
    return inCrmScope(data, scope) ? data : null;
  },

  async getMemberByUser(userId, scope) {
    const snap = await getDb()
      .collection(MEMBERS)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .limit(1)
      .get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return doc.data() as WorkspaceMember;
  },

  async updateMemberRole(id, role, scope) {
    const existing = await this.getMember(id, scope);
    if (!existing) return null;
    if (existing.role === "owner" && role !== "owner") {
      const owners = (await listMembersScoped(scope)).filter(
        (m) => m.role === "owner" && m.id !== id
      );
      if (owners.length === 0) return null;
    }
    const updated = { ...existing, role, updatedAt: crmNow() };
    await getDb().collection(MEMBERS).doc(id).set(updated);
    return updated;
  },

  async removeMember(id, scope) {
    const existing = await this.getMember(id, scope);
    if (!existing || existing.role === "owner") return false;
    await getDb().collection(MEMBERS).doc(id).delete();
    return true;
  },

  async listInvitations(scope) {
    const snap = await getDb()
      .collection(INVITATIONS)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();
    return snap.docs
      .map((doc) => doc.data() as Invitation)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async listInvitationsByTenant(tenantId) {
    const snap = await getDb()
      .collection(INVITATIONS)
      .where("tenantId", "==", tenantId)
      .get();
    return snap.docs
      .map((doc) => doc.data() as Invitation)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async getInvitationByToken(token) {
    const snap = await getDb()
      .collection(INVITATIONS)
      .where("token", "==", token)
      .limit(1)
      .get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return doc.data() as Invitation;
  },

  async createInvitation(input: CreateInvitationInput, scope) {
    const now = crmNow();
    const invitation: Invitation = {
      ...scope,
      ...input,
      id: crmNewId("inv"),
      token: crmNewId("tok"),
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    };
    await getDb().collection(INVITATIONS).doc(invitation.id).set(invitation);
    return invitation;
  },

  async revokeInvitation(id, scope) {
    const snap = await getDb().collection(INVITATIONS).doc(id).get();
    if (!snap.exists) return false;
    const data = snap.data() as Invitation;
    if (!inCrmScope(data, scope) || data.status !== "pending") return false;
    await getDb()
      .collection(INVITATIONS)
      .doc(id)
      .set({ ...data, status: "revoked" });
    return true;
  },

  async acceptInvitation(token) {
    const snap = await getDb()
      .collection(INVITATIONS)
      .where("token", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();
    if (snap.empty) return null;
    const data = snap.docs[0].data() as Invitation;
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      await snap.docs[0].ref.set({ ...data, status: "expired" });
      return null;
    }
    await snap.docs[0].ref.set({ ...data, status: "accepted" });
    return { ...data, status: "accepted" };
  },

  async listMembershipsForUser(userId) {
    const snap = await getDb()
      .collection(MEMBERS)
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .get();
    return snap.docs.map((doc) => doc.data() as WorkspaceMember);
  },

  async createMember(input, scope) {
    const existing = await this.getMemberByUser(input.userId, scope);
    if (existing) return existing;

    const now = crmNow();
    const member: WorkspaceMember = {
      ...scope,
      id: crmNewId("member"),
      userId: input.userId,
      email: input.email,
      name: input.name,
      role: input.role,
      status: "active",
      joinedAt: now,
      updatedAt: now,
    };
    await getDb().collection(MEMBERS).doc(member.id).set(member);
    return member;
  },
};

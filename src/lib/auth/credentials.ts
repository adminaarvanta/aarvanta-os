import type { SessionPayload } from "@/lib/auth/session";
import { verifyUserPassword } from "@/lib/auth/user-credentials";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import type { WorkspaceMember } from "@/types/tenant";

/** Env bootstrap owner (single AUTH_EMAIL / AUTH_PASSWORD). */
export function validateBootstrapCredentials(
  email: string,
  password: string
): SessionPayload | null {
  const expectedEmail = process.env.AUTH_EMAIL;
  const expectedPassword = process.env.AUTH_PASSWORD;
  const tenantId = process.env.TENANT_ID;
  const workspaceId = process.env.WORKSPACE_ID;
  const companyId = process.env.COMPANY_ID;

  if (
    !expectedEmail ||
    !expectedPassword ||
    !tenantId ||
    !workspaceId ||
    !companyId
  ) {
    return null;
  }

  if (
    email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase() ||
    password !== expectedPassword
  ) {
    return null;
  }

  return {
    email: expectedEmail.trim().toLowerCase(),
    name: expectedEmail.split("@")[0] ?? "Owner",
    userId: process.env.AUTH_USER_ID ?? "user_prod",
    role: "owner",
    tenantId,
    workspaceId,
    companyId,
  };
}

function sessionFromMembership(
  member: WorkspaceMember,
  email: string
): SessionPayload {
  return {
    email: email.trim().toLowerCase(),
    name: member.name,
    userId: member.userId,
    role: member.role,
    tenantId: member.tenantId,
    workspaceId: member.workspaceId,
    companyId: member.companyId,
  };
}

async function findActiveMembership(
  userId: string,
  email: string
): Promise<WorkspaceMember | null> {
  const repo = getTenantRepository();
  const byUser = await repo.listMembershipsForUser(userId);
  const preferredWorkspace = process.env.WORKSPACE_ID?.trim();
  const fromUser =
    (preferredWorkspace
      ? byUser.find((m) => m.workspaceId === preferredWorkspace)
      : undefined) ??
    byUser[0] ??
    null;
  if (fromUser) return fromUser;

  // Fallback: memberships keyed by email (handles legacy casing / userId drift).
  const normalized = email.trim().toLowerCase();
  const tenantId = process.env.TENANT_ID?.trim();
  if (!tenantId) return null;
  const all = await repo.listMembersByTenant(tenantId);
  const matches = all.filter(
    (m) =>
      m.status === "active" &&
      (m.email.trim().toLowerCase() === normalized || m.userId === userId)
  );
  return (
    (preferredWorkspace
      ? matches.find((m) => m.workspaceId === preferredWorkspace)
      : undefined) ??
    matches[0] ??
    null
  );
}

/**
 * Authenticate invited users (Firestore credentials) or bootstrap owner env.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionPayload | null> {
  await ensureDatastoreReady();

  const normalized = email.trim().toLowerCase();
  const creds = await verifyUserPassword(normalized, password);
  if (creds) {
    let member = await findActiveMembership(creds.userId, normalized);

    // Repair: password exists but membership was lost (cold-start memory bug).
    if (!member) {
      member = await repairMembershipFromInvitation(creds.userId, normalized);
    }

    if (member) {
      return sessionFromMembership(
        { ...member, userId: member.userId || creds.userId },
        normalized
      );
    }
    console.warn(
      "[auth] Password ok but no active membership for",
      normalized,
      creds.userId
    );
  }

  return validateBootstrapCredentials(normalized, password);
}

async function repairMembershipFromInvitation(
  userId: string,
  email: string
): Promise<WorkspaceMember | null> {
  const tenantId = process.env.TENANT_ID?.trim();
  if (!tenantId) return null;
  const repo = getTenantRepository();
  const invitations = await repo.listInvitationsByTenant(tenantId);
  const invitation = invitations.find(
    (i) =>
      i.email.trim().toLowerCase() === email &&
      (i.status === "accepted" || i.status === "pending")
  );
  if (!invitation) return null;

  const workspace = await repo.getWorkspace(invitation.workspaceId);
  const scope = {
    tenantId: invitation.tenantId,
    workspaceId: invitation.workspaceId,
    companyId: workspace?.defaultCompanyId ?? invitation.companyId,
  };

  return repo.createMember(
    {
      userId,
      email,
      name: email.split("@")[0] || "Member",
      role: invitation.role,
    },
    scope
  );
}

/** @deprecated Use authenticateUser — kept for any direct imports. */
export function validateCredentials(
  email: string,
  password: string
): SessionPayload | null {
  return validateBootstrapCredentials(email, password);
}

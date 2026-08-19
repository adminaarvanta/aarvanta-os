import type { SessionPayload } from "@/lib/auth/session";
import { verifyUserPassword } from "@/lib/auth/user-credentials";
import { ensureFreeTierMembership } from "@/lib/auth/provision-free-account";
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

function pickMembership(
  memberships: WorkspaceMember[],
  email: string,
  userId: string
): WorkspaceMember | null {
  const key = email.trim().toLowerCase();
  const preferredWorkspace = process.env.WORKSPACE_ID?.trim();
  const matches = memberships.filter(
    (m) =>
      m.status === "active" &&
      (m.email.trim().toLowerCase() === key || m.userId === userId)
  );
  if (matches.length === 0) return null;

  return (
    (preferredWorkspace
      ? matches.find((m) => m.workspaceId === preferredWorkspace)
      : undefined) ??
    matches.find((m) => m.email.trim().toLowerCase() === key) ??
    matches[0] ??
    null
  );
}

async function findActiveMembership(
  userId: string,
  email: string
): Promise<WorkspaceMember | null> {
  const repo = getTenantRepository();
  const normalized = email.trim().toLowerCase();

  const fromUser = pickMembership(
    await repo.listMembershipsForUser(userId),
    normalized,
    userId
  );
  if (fromUser) return fromUser;

  // Self-serve signups live in their own org — not only TENANT_ID.
  const fromEmail = pickMembership(
    await repo.listMembershipsForEmail(normalized),
    normalized,
    userId
  );
  if (fromEmail) return fromEmail;

  // Legacy fallback: bootstrap tenant from env.
  const tenantId = process.env.TENANT_ID?.trim();
  if (!tenantId) return null;
  const all = await repo.listMembersByTenant(tenantId);
  return pickMembership(all, normalized, userId);
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

    if (!member) {
      member = await repairMembershipFromInvitation(creds.userId, normalized);
    }

    if (!member) {
      try {
        member = await ensureFreeTierMembership({
          email: normalized,
          userId: creds.userId,
        });
      } catch (error) {
        console.warn(
          "[auth] Could not repair membership for",
          normalized,
          error instanceof Error ? error.message : error
        );
      }
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

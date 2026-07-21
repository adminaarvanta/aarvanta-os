import type { SessionPayload } from "@/lib/auth/session";
import { verifyUserPassword } from "@/lib/auth/user-credentials";
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

async function sessionFromMembership(
  member: WorkspaceMember,
  email: string
): Promise<SessionPayload | null> {
  const repo = getTenantRepository();
  const workspace = await repo.getWorkspace(member.workspaceId);
  if (!workspace) return null;
  return {
    email: email.trim().toLowerCase(),
    name: member.name,
    userId: member.userId,
    role: member.role,
    tenantId: member.tenantId,
    workspaceId: member.workspaceId,
    companyId: workspace.defaultCompanyId || member.companyId,
  };
}

/**
 * Authenticate invited users (Firestore/memory credentials) or bootstrap owner env.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionPayload | null> {
  const normalized = email.trim().toLowerCase();
  const creds = await verifyUserPassword(normalized, password);
  if (creds) {
    const repo = getTenantRepository();
    const memberships = await repo.listMembershipsForUser(creds.userId);
    const active = memberships.filter((m) => m.status === "active");
    const preferredWorkspace = process.env.WORKSPACE_ID?.trim();
    const member =
      (preferredWorkspace
        ? active.find((m) => m.workspaceId === preferredWorkspace)
        : undefined) ??
      active[0] ??
      null;
    if (member) {
      return sessionFromMembership(member, normalized);
    }
  }

  return validateBootstrapCredentials(normalized, password);
}

/** @deprecated Use authenticateUser — kept for any direct imports. */
export function validateCredentials(
  email: string,
  password: string
): SessionPayload | null {
  return validateBootstrapCredentials(email, password);
}

import type { SessionPayload } from "@/lib/auth/session";

export function validateCredentials(
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

  if (email !== expectedEmail || password !== expectedPassword) {
    return null;
  }

  return {
    email,
    name: email.split("@")[0] ?? "Agent",
    userId: process.env.AUTH_USER_ID ?? "user_prod",
    role: "owner",
    tenantId,
    workspaceId,
    companyId,
  };
}

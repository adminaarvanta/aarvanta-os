import { isDemoMode } from "@/lib/config/app-mode";
import { getSessionFromCookies, sessionToScope } from "@/lib/auth/session";
import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import type { TenantScope } from "@/types/communication";

export async function getTenantScope(): Promise<TenantScope> {
  if (isDemoMode()) return DEMO_TENANT;

  const session = await getSessionFromCookies();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return sessionToScope(session);
}

export async function getOptionalSession() {
  if (isDemoMode()) return null;
  return getSessionFromCookies();
}

export function getProductionTenantScope(): TenantScope {
  return {
    tenantId: process.env.TENANT_ID!,
    workspaceId: process.env.WORKSPACE_ID!,
    companyId: process.env.COMPANY_ID!,
  };
}

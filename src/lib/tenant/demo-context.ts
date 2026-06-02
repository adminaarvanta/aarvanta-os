import type { TenantScope } from "@/types/communication";

/** Demo tenant until auth + Firebase workspace provisioning ships */
export const DEMO_TENANT: TenantScope = {
  tenantId: "tenant_demo",
  workspaceId: "ws_demo",
  companyId: "company_demo",
};

export function scopeQuery(scope: TenantScope) {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    companyId: scope.companyId,
  };
}

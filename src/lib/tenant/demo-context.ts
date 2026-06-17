import type { MemberRole } from "@/types/tenant";
import {
  DEMO_COMPANY_AARVANTA,
  DEMO_ORG_AARVANTA,
  DEMO_WS_AARVANTA_MAIN,
} from "@/lib/data/tenant-demo-seed";
import type { TenantScope } from "@/types/communication";

export const WORKSPACE_COOKIE = "aarvanta_workspace";

/** Demo tenant until auth + Firebase workspace provisioning ships */
export const DEMO_TENANT: TenantScope = {
  tenantId: DEMO_ORG_AARVANTA,
  workspaceId: DEMO_WS_AARVANTA_MAIN,
  companyId: DEMO_COMPANY_AARVANTA,
};

export const DEMO_USER = {
  userId: "user_pavan",
  email: "pavan@aarvanta.com",
  name: "Pavan",
  role: "owner" as MemberRole,
};

export function scopeQuery(scope: TenantScope) {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    companyId: scope.companyId,
  };
}

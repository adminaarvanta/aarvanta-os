import type { TenantScope } from "@/types/communication";
import { isProductionMode } from "@/lib/config/app-mode";
import { useMemoryDatastore } from "@/lib/data/datastore";
import { DEMO_TENANT } from "@/lib/tenant/demo-context";

function scopesMatch(a: TenantScope, b: TenantScope) {
  return (
    a.tenantId === b.tenantId &&
    a.workspaceId === b.workspaceId &&
    a.companyId === b.companyId
  );
}

function productionTenantScope(): TenantScope | null {
  const tenantId = process.env.TENANT_ID;
  const workspaceId = process.env.WORKSPACE_ID;
  const companyId = process.env.COMPANY_ID;
  if (!tenantId || !workspaceId || !companyId) return null;
  return { tenantId, workspaceId, companyId };
}

/** Match tenant scope, including demo ↔ production aliasing during memory fallback. */
export function inCrmScope<T extends TenantScope>(record: T, scope: TenantScope) {
  if (scopesMatch(record, scope)) return true;

  if (isProductionMode() && useMemoryDatastore()) {
    const prod = productionTenantScope();
    if (!prod) return false;

    const recordIsDemo = scopesMatch(record, DEMO_TENANT);
    const scopeIsProd = scopesMatch(scope, prod);
    const recordIsProd = scopesMatch(record, prod);
    const scopeIsDemo = scopesMatch(scope, DEMO_TENANT);

    if ((recordIsDemo && scopeIsProd) || (recordIsProd && scopeIsDemo)) {
      return true;
    }
  }

  return false;
}

export function crmNewId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function crmNow() {
  return new Date().toISOString();
}

export function sumPurchases(
  purchases: { amount: number }[]
): number {
  return purchases.reduce((sum, p) => sum + p.amount, 0);
}

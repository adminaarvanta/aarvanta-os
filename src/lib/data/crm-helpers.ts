import type { TenantScope } from "@/types/communication";
import { isProductionMode } from "@/lib/config/app-mode";
import { isMemoryDatastore } from "@/lib/data/datastore";
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

/** Persistable tenant fields — strips query-only viewer metadata. */
export function persistScope(scope: TenantScope): TenantScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    companyId: scope.companyId,
    ...(scope.ownerUserId ? { ownerUserId: scope.ownerUserId } : {}),
  };
}

/** Drop query-only fields before writing a record assembled from session scope. */
export function stripQueryScope<T extends TenantScope>(record: T): T {
  const rest = { ...record };
  delete rest.viewerRole;
  return { ...rest, ...persistScope(record) };
}

/** Workspace fields only — for members, invitations, and team collaboration. */
export function persistWorkspaceScope(scope: TenantScope): TenantScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    companyId: scope.companyId,
  };
}

/** Workspace-only match for org members, invitations, and team collaboration. */
export function inWorkspaceScope<T extends TenantScope>(
  record: T,
  scope: TenantScope
) {
  if (scopesMatch(record, scope)) return true;

  if (isProductionMode() && isMemoryDatastore()) {
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

function recordOwnerUserId(record: TenantScope): string | undefined {
  if (record.ownerUserId) return record.ownerUserId;
  const assigned = (record as TenantScope & { ownerId?: string }).ownerId;
  return assigned || undefined;
}

/**
 * Module data match: same workspace, then isolate to the signed-in user.
 * System/webhook scopes (no ownerUserId) still see the whole workspace.
 * Legacy rows without an owner are visible only to the workspace owner.
 */
export function inUserDataScope<T extends TenantScope>(
  record: T,
  scope: TenantScope
) {
  if (!inWorkspaceScope(record, scope)) return false;
  if (!scope.ownerUserId) return true;

  const recordOwner = recordOwnerUserId(record);
  if (recordOwner) return recordOwner === scope.ownerUserId;
  return scope.viewerRole === "owner";
}

/** Match tenant + user ownership for CRM and other operating modules. */
export function inCrmScope<T extends TenantScope>(record: T, scope: TenantScope) {
  return inUserDataScope(record, scope);
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

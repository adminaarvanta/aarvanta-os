import type { TenantScope } from "@/types/communication";

export function inCrmScope<T extends TenantScope>(record: T, scope: TenantScope) {
  return (
    record.tenantId === scope.tenantId &&
    record.workspaceId === scope.workspaceId &&
    record.companyId === scope.companyId
  );
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

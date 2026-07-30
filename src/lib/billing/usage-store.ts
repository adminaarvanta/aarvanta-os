import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { getBillingStore } from "@/lib/data/platform-store";
import type { TenantScope } from "@/types/communication";
import type { UsageMetric, UsageRecord } from "@/types/platform-modules";

export function currentUsagePeriod(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function usageRecordId(metric: UsageMetric, period: string): string {
  return `usage_${metric}_${period}`;
}

export async function getUsageQuantity(
  scope: TenantScope,
  metric: UsageMetric,
  period = currentUsagePeriod()
): Promise<number> {
  const store = getBillingStore();
  const records = await store.listUsage(scope);
  const match = records.find((r) => r.metric === metric && r.period === period);
  return match?.quantity ?? 0;
}

export async function getPeriodUsage(
  scope: TenantScope,
  period = currentUsagePeriod()
): Promise<Record<UsageMetric, number>> {
  const store = getBillingStore();
  const records = await store.listUsage(scope);
  const base: Record<UsageMetric, number> = {
    ai_credits: 0,
    voice_minutes: 0,
    whatsapp_conversations: 0,
    emails: 0,
    seats: 0,
    storage_mb: 0,
  };
  for (const r of records) {
    if (r.period === period && r.metric in base) {
      base[r.metric] = r.quantity;
    }
  }
  return base;
}

export async function incrementUsage(
  scope: TenantScope,
  metric: UsageMetric,
  amount: number,
  period = currentUsagePeriod()
): Promise<UsageRecord> {
  if (amount <= 0) {
    throw new Error("Usage increment must be positive");
  }
  const store = getBillingStore();
  const id = usageRecordId(metric, period);
  const existing = await store.getUsage(id, scope);
  const now = crmNow();
  const quantity = (existing?.quantity ?? 0) + amount;
  const record: UsageRecord = {
    ...scope,
    id,
    metric,
    quantity,
    period,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await store.setUsage(record);
  return record;
}

/** Ensure a deterministic id when creating via createUsage (some stores overwrite id). */
export async function setUsageQuantity(
  scope: TenantScope,
  metric: UsageMetric,
  quantity: number,
  period = currentUsagePeriod()
): Promise<UsageRecord> {
  const store = getBillingStore();
  const id = usageRecordId(metric, period);
  const now = crmNow();
  const existing = await store.getUsage(id, scope);
  const record: UsageRecord = {
    ...scope,
    id,
    metric,
    quantity,
    period,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await store.setUsage(record);
  return record;
}

export function unusedId() {
  return crmNewId("usage");
}

import { crmNow } from "@/lib/data/crm-helpers";
import { getBillingStore } from "@/lib/data/platform-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import type { TenantScope } from "@/types/communication";
import type { PublicPlanId } from "@/types/platform-modules";

/** Activate or clear a SaaS plan locally (demo checkout / settings sync). */
export async function upsertLocalSubscription(input: {
  scope: TenantScope;
  planId: PublicPlanId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<void> {
  const store = getBillingStore();
  const existing = await store.list(input.scope);
  const now = crmNow();
  const periodEnd = new Date();
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 30);

  // Cancel previous active rows for this scope
  for (const sub of existing) {
    if (sub.status === "active" || sub.status === "trialing") {
      await store.set({ ...sub, status: "canceled" });
    }
  }

  if (input.planId === "free") {
    try {
      const org = await getTenantRepository().getOrganization(input.scope.tenantId);
      if (org) {
        await getTenantRepository().upsertOrganization({
          ...org,
          plan: "free",
          updatedAt: now,
        });
      }
    } catch {
      /* org sync optional */
    }
    return;
  }

  const id =
    existing.find((s) => s.planId === input.planId)?.id ??
    `sub_${input.scope.tenantId}_${input.planId}`;

  await store.set({
    ...input.scope,
    id,
    planId: input.planId,
    status: "active",
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    currentPeriodEnd: periodEnd.toISOString(),
    createdAt: existing.find((s) => s.id === id)?.createdAt ?? now,
  });

  try {
    const org = await getTenantRepository().getOrganization(input.scope.tenantId);
    if (org) {
      await getTenantRepository().upsertOrganization({
        ...org,
        plan: input.planId,
        updatedAt: now,
      });
    }
  } catch {
    /* org sync optional */
  }
}

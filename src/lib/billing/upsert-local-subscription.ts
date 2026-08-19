import { crmNow } from "@/lib/data/crm-helpers";
import { getBillingStore } from "@/lib/data/platform-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import type { TenantScope } from "@/types/communication";
import type { PublicPlanId, Subscription } from "@/types/platform-modules";

function isUsable(sub: Subscription): boolean {
  return (
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due"
  );
}

async function syncOrgPlan(scope: TenantScope, planId: PublicPlanId) {
  try {
    const org = await getTenantRepository().getOrganization(scope.tenantId);
    if (!org) return;
    await getTenantRepository().upsertOrganization({
      ...org,
      plan: planId,
      updatedAt: crmNow(),
    });
  } catch {
    /* org sync optional */
  }
}

/** Activate, update, or clear a SaaS plan locally (checkout, webhooks, demo). */
export async function upsertLocalSubscription(input: {
  scope: TenantScope;
  planId: PublicPlanId;
  status?: Subscription["status"];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
}): Promise<Subscription | null> {
  const store = getBillingStore();
  const existing = await store.list(input.scope);
  const now = crmNow();
  const status = input.status ?? "active";
  const periodEnd =
    input.currentPeriodEnd ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const matched =
    existing.find(
      (s) =>
        input.stripeSubscriptionId &&
        s.stripeSubscriptionId === input.stripeSubscriptionId
    ) ??
    existing.find((s) => s.planId === input.planId && s.planId !== "free") ??
    existing.find((s) => isUsable(s));

  if (input.planId === "free" || status === "canceled") {
    if (matched) {
      await store.set({
        ...matched,
        status: "canceled",
        stripeCustomerId: input.stripeCustomerId ?? matched.stripeCustomerId,
        stripeSubscriptionId:
          input.stripeSubscriptionId ?? matched.stripeSubscriptionId,
        currentPeriodEnd: periodEnd,
      });
    }
    const remaining = (await store.list(input.scope)).filter(isUsable);
    const nextPlan = remaining[0]?.planId ?? "free";
    await syncOrgPlan(input.scope, nextPlan);
    return matched ? { ...matched, status: "canceled" } : null;
  }

  if (status === "active" || status === "trialing") {
    for (const sub of existing) {
      if (sub.id === matched?.id) continue;
      if (sub.status === "active" || sub.status === "trialing") {
        await store.set({ ...sub, status: "canceled" });
      }
    }
  }

  const id = matched?.id ?? `sub_${input.scope.tenantId}_${input.planId}`;
  const saved: Subscription = {
    ...input.scope,
    id,
    planId: input.planId,
    status,
    stripeCustomerId: input.stripeCustomerId ?? matched?.stripeCustomerId,
    stripeSubscriptionId:
      input.stripeSubscriptionId ?? matched?.stripeSubscriptionId,
    currentPeriodEnd: periodEnd,
    createdAt: matched?.createdAt ?? now,
  };
  await store.set(saved);
  await syncOrgPlan(input.scope, input.planId);
  return saved;
}

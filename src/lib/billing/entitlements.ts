import {
  getPlan,
  type FeatureAccess,
  type PlanDefinition,
  type PlanFeatureMatrix,
  type PlanLimits,
  type PublicPlanId,
} from "@/lib/billing/plan-catalog";
import type { PlanFeatureKey } from "@/lib/billing/module-access";
import { getPeriodUsage } from "@/lib/billing/usage-store";
import { getBillingStore } from "@/lib/data/platform-store";
import type { TenantScope } from "@/types/communication";
import type { Subscription, UsageMetric } from "@/types/platform-modules";

export type UsageSnapshot = Record<UsageMetric, number>;

export type Entitlements = {
  planId: PublicPlanId;
  plan: PlanDefinition;
  subscription: Subscription | null;
  limits: PlanLimits;
  features: PlanFeatureMatrix;
  usage: UsageSnapshot;
  period: string;
};

function isUsableSubscription(sub: Subscription): boolean {
  return (
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due"
  );
}

export async function resolveEntitlements(
  scope: TenantScope
): Promise<Entitlements> {
  const store = getBillingStore();
  const subscriptions = await store.list(scope);
  const paid = subscriptions
    .filter(
      (s) =>
        isUsableSubscription(s) && s.planId !== "free" && Boolean(getPlan(s.planId))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const planId: PublicPlanId = paid?.planId ?? "free";
  const plan = getPlan(planId) ?? getPlan("free")!;
  const { currentUsagePeriod } = await import("@/lib/billing/usage-store");
  const period = currentUsagePeriod();
  const usage = await getPeriodUsage(scope, period);

  return {
    planId,
    plan,
    subscription: paid ?? null,
    limits: plan.limits,
    features: plan.features,
    usage,
    period,
  };
}

export function featureAccess(
  entitlements: Entitlements,
  key: PlanFeatureKey
): FeatureAccess {
  return entitlements.features[key];
}

export function limitValue(
  entitlements: Entitlements,
  key: keyof PlanLimits
): number | "unlimited" {
  return entitlements.limits[key];
}

export function remainingForMetric(
  entitlements: Entitlements,
  metric: UsageMetric
): number | "unlimited" {
  const map: Partial<Record<UsageMetric, keyof PlanLimits>> = {
    ai_credits: "aiCredits",
    voice_minutes: "voiceMinutes",
    whatsapp_conversations: "whatsappConversations",
    emails: "emailsPerMonth",
    seats: "users",
    storage_mb: "storageGb",
  };
  const limitKey = map[metric];
  if (!limitKey) return "unlimited";
  const limit = entitlements.limits[limitKey];
  if (limit === "unlimited") return "unlimited";
  // storageGb → storage_mb
  const cap = metric === "storage_mb" ? limit * 1024 : limit;
  return Math.max(0, cap - (entitlements.usage[metric] ?? 0));
}

export function usagePercent(
  entitlements: Entitlements,
  metric: UsageMetric
): number | null {
  const remaining = remainingForMetric(entitlements, metric);
  if (remaining === "unlimited") return null;
  const map: Partial<Record<UsageMetric, keyof PlanLimits>> = {
    ai_credits: "aiCredits",
    voice_minutes: "voiceMinutes",
    whatsapp_conversations: "whatsappConversations",
    emails: "emailsPerMonth",
  };
  const limitKey = map[metric];
  if (!limitKey) return null;
  const limit = entitlements.limits[limitKey];
  if (limit === "unlimited" || limit <= 0) return null;
  return Math.min(100, Math.round(((entitlements.usage[metric] ?? 0) / limit) * 100));
}

/** Suggest next paid plan for upgrade CTAs. */
export function suggestUpgrade(from: PublicPlanId): PublicPlanId {
  if (from === "free") return "starter";
  if (from === "starter") return "growth";
  if (from === "growth") return "scale";
  return "enterprise";
}

/** Client-safe slice of entitlements for React context. */
export type EntitlementsClient = {
  planId: PublicPlanId;
  planName: string;
  priceMonthly: number | null;
  features: PlanFeatureMatrix;
  limits: PlanLimits;
  usage: UsageSnapshot;
  period: string;
  creditsRemaining: number | "unlimited";
  creditsPercent: number | null;
};

export function toClientEntitlements(e: Entitlements): EntitlementsClient {
  return {
    planId: e.planId,
    planName: e.plan.name,
    priceMonthly: e.plan.priceMonthly,
    features: e.features,
    limits: e.limits,
    usage: e.usage,
    period: e.period,
    creditsRemaining: remainingForMetric(e, "ai_credits"),
    creditsPercent: usagePercent(e, "ai_credits"),
  };
}

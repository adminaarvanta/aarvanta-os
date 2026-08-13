import {
  creditsForAction,
  type CreditTariffActionId,
  type FeatureAccess,
} from "@/lib/billing/plan-catalog";
import { PlanEntitlementError } from "@/lib/billing/errors";
import {
  featureAccess,
  remainingForMetric,
  resolveEntitlements,
  suggestUpgrade,
  type Entitlements,
} from "@/lib/billing/entitlements";
import {
  hasMinAccess,
  type PlanFeatureKey,
} from "@/lib/billing/module-access";
import { incrementUsage } from "@/lib/billing/usage-store";
import type { TenantScope } from "@/types/communication";

export async function requireFeature(
  scope: TenantScope,
  key: PlanFeatureKey,
  minAccess: FeatureAccess = "lite"
): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  const actual = featureAccess(entitlements, key);
  if (actual === "none") {
    throw new PlanEntitlementError(
      "FEATURE_LOCKED",
      `${key} is not included in the ${entitlements.plan.name} plan.`,
      {
        feature: key,
        upgradeHint: suggestUpgrade(entitlements.planId),
      }
    );
  }
  if (!hasMinAccess(actual, minAccess)) {
    if (actual === "explore") {
      throw new PlanEntitlementError(
        "EXPLORE_ONLY",
        `${key} is explore-only on ${entitlements.plan.name}. Upgrade to use it in production.`,
        {
          feature: key,
          upgradeHint: suggestUpgrade(entitlements.planId),
        }
      );
    }
    throw new PlanEntitlementError(
      "FEATURE_LOCKED",
      `${key} requires a higher plan (need ${minAccess}, have ${actual}).`,
      {
        feature: key,
        upgradeHint: suggestUpgrade(entitlements.planId),
      }
    );
  }
  return entitlements;
}

export async function requirePublishLive(scope: TenantScope): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  if (!entitlements.features.publishLiveBusiness) {
    throw new PlanEntitlementError(
      "FEATURE_LOCKED",
      "Publishing a live business requires a paid plan.",
      {
        feature: "publishLiveBusiness",
        upgradeHint: "starter",
      }
    );
  }
  return entitlements;
}

export async function consumeCredits(
  scope: TenantScope,
  actionId: CreditTariffActionId,
  multiplier = 1
): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  const cost = creditsForAction(actionId) * multiplier;
  if (cost <= 0) return entitlements;

  const remaining = remainingForMetric(entitlements, "ai_credits");
  if (remaining !== "unlimited" && remaining < cost) {
    throw new PlanEntitlementError(
      "PLAN_LIMIT",
      `Not enough AI credits (need ${cost}, have ${remaining}).`,
      {
        metric: "ai_credits",
        upgradeHint: suggestUpgrade(entitlements.planId),
      }
    );
  }

  await incrementUsage(scope, "ai_credits", cost);
  return resolveEntitlements(scope);
}

export async function consumeVoiceMinutes(
  scope: TenantScope,
  minutes: number
): Promise<Entitlements> {
  if (minutes <= 0) return resolveEntitlements(scope);
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  await requireFeature(scope, "voiceAi", "lite");
  const fresh = await resolveEntitlements(scope);
  const remaining = remainingForMetric(fresh, "voice_minutes");
  if (remaining !== "unlimited" && remaining < minutes) {
    throw new PlanEntitlementError(
      "PLAN_LIMIT",
      `Not enough AI voice minutes (need ${minutes}, have ${remaining}).`,
      {
        metric: "voice_minutes",
        feature: "voiceAi",
        upgradeHint: suggestUpgrade(fresh.planId),
      }
    );
  }
  await incrementUsage(scope, "voice_minutes", minutes);
  return resolveEntitlements(scope);
}

/** Pre-check before starting a call (reserve at least 1 minute). */
export async function requireVoiceCapacity(
  scope: TenantScope,
  minutesNeeded = 1
): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  await requireFeature(scope, "voiceAi", "lite");
  const fresh = await resolveEntitlements(scope);
  const remaining = remainingForMetric(fresh, "voice_minutes");
  if (remaining !== "unlimited" && remaining < minutesNeeded) {
    throw new PlanEntitlementError(
      "PLAN_LIMIT",
      `No AI voice minutes remaining on ${fresh.plan.name}.`,
      {
        metric: "voice_minutes",
        feature: "voiceAi",
        upgradeHint: suggestUpgrade(fresh.planId),
      }
    );
  }
  return fresh;
}

export async function consumeWhatsAppConversation(
  scope: TenantScope
): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  await requireFeature(scope, "whatsappChannel", "lite");
  const fresh = await resolveEntitlements(scope);
  const remaining = remainingForMetric(fresh, "whatsapp_conversations");
  if (remaining !== "unlimited" && remaining < 1) {
    throw new PlanEntitlementError(
      "PLAN_LIMIT",
      `WhatsApp conversation allowance used up on ${fresh.plan.name}.`,
      {
        metric: "whatsapp_conversations",
        feature: "whatsappChannel",
        upgradeHint: suggestUpgrade(fresh.planId),
      }
    );
  }
  await incrementUsage(scope, "whatsapp_conversations", 1);
  return resolveEntitlements(scope);
}

export async function consumeEmailSend(
  scope: TenantScope,
  count = 1
): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  await requireFeature(scope, "emailChannel", "lite");
  const fresh = await resolveEntitlements(scope);
  const remaining = remainingForMetric(fresh, "emails");
  if (remaining !== "unlimited" && remaining < count) {
    throw new PlanEntitlementError(
      "PLAN_LIMIT",
      `Email allowance exceeded on ${fresh.plan.name}.`,
      {
        metric: "emails",
        feature: "emailChannel",
        upgradeHint: suggestUpgrade(fresh.planId),
      }
    );
  }
  await incrementUsage(scope, "emails", count);
  return resolveEntitlements(scope);
}

export async function requireAiEmployeeSlot(
  scope: TenantScope,
  activeCount: number
): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  const gated = await requireFeature(scope, "aiWorkforce", "explore");
  const limit = gated.limits.aiEmployees;
  if (limit !== "unlimited" && activeCount > limit) {
    throw new PlanEntitlementError(
      "PLAN_LIMIT",
      `AI Employee limit reached (${limit} on ${gated.plan.name}).`,
      {
        metric: "ai_employees",
        feature: "aiWorkforce",
        upgradeHint: suggestUpgrade(gated.planId),
      }
    );
  }
  return gated;
}

/** Free: only one Build draft job. Paid: unlimited (or plan limit). */
export async function requireBuildDraftCreate(
  scope: TenantScope,
  existingJobCount: number
): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  await requireFeature(scope, "websiteBuilder", "explore");
  const fresh = await resolveEntitlements(scope);
  const limit = fresh.limits.buildDrafts ?? "unlimited";
  if (limit !== "unlimited" && existingJobCount >= limit) {
    throw new PlanEntitlementError(
      "PLAN_LIMIT",
      `Free includes 1 website draft. Upgrade to create another site.`,
      {
        metric: "build_drafts",
        feature: "websiteBuilder",
        upgradeHint: suggestUpgrade(fresh.planId),
      }
    );
  }
  return fresh;
}

/**
 * Free: one AI generate per draft; refines after first generate require upgrade.
 * Jobs that already have a generatedSite (or status generated) are blocked on Free.
 */
export async function requireBuildGenerate(
  scope: TenantScope,
  job: { generatedSite?: unknown; status?: string }
): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(scope);
  if (entitlements.isSuperAdmin) return entitlements;
  await requireFeature(scope, "websiteBuilder", "explore");
  const fresh = await resolveEntitlements(scope);
  const limit = fresh.limits.buildDrafts ?? "unlimited";
  if (limit === "unlimited") return fresh;

  const alreadyGenerated =
    Boolean(job.generatedSite) || job.status === "generated";

  if (alreadyGenerated) {
    throw new PlanEntitlementError(
      "PLAN_LIMIT",
      `Free includes 1 AI generate for your draft. Upgrade to refine or regenerate.`,
      {
        metric: "build_drafts",
        feature: "websiteBuilder",
        upgradeHint: suggestUpgrade(fresh.planId),
      }
    );
  }
  return fresh;
}

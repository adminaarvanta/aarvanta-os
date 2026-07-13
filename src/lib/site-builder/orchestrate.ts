import { crmNow, crmNewId } from "@/lib/data/crm-helpers";
import { planSiteFromPreferences } from "@/lib/site-builder/plan-site";
import type { TenantScope } from "@/types/communication";
import type {
  CreateSiteBuildJobInput,
  SiteBuildJob,
  SitePreferences,
} from "@/types/site-builder";

export function newSiteBuildId(): string {
  return crmNewId("build");
}

export function createSiteBuildJob(
  preferences: CreateSiteBuildJobInput,
  scope: TenantScope
): SiteBuildJob {
  const now = crmNow();
  return {
    ...scope,
    id: newSiteBuildId(),
    status: "draft",
    preferences,
    createdAt: now,
    updatedAt: now,
  };
}

export async function generateSitePlan(job: SiteBuildJob): Promise<SiteBuildJob> {
  const now = crmNow();
  const planning: SiteBuildJob = {
    ...job,
    status: "planning",
    error: undefined,
    updatedAt: now,
  };

  try {
    const { plan, usedAi } = await planSiteFromPreferences(job.preferences);
    return {
      ...planning,
      status: "plan_ready",
      plan,
      usedAi,
      updatedAt: crmNow(),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Site planning failed.";
    return {
      ...planning,
      status: "failed",
      error: message,
      updatedAt: crmNow(),
    };
  }
}

export function approveSitePlan(job: SiteBuildJob): SiteBuildJob {
  if (job.status !== "plan_ready" || !job.plan) {
    throw new Error("Site plan must be ready before approval.");
  }

  return {
    ...job,
    status: "approved",
    approvedAt: crmNow(),
    updatedAt: crmNow(),
  };
}

export function updateSitePreferences(
  job: SiteBuildJob,
  preferences: SitePreferences
): SiteBuildJob {
  return {
    ...job,
    preferences,
    plan: undefined,
    usedAi: undefined,
    approvedAt: undefined,
    status: "draft",
    error: undefined,
    updatedAt: crmNow(),
  };
}

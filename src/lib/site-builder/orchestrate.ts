import { crmNow, crmNewId } from "@/lib/data/crm-helpers";
import {
  runGenerationPipeline,
  type PipelineProgressEvent,
} from "@/lib/site-builder/agents/pipeline";
import { planSiteFromPreferences } from "@/lib/site-builder/plan-site";
import { generateSiteFromPlan } from "@/lib/site-builder/generate-site";
import { resolveSiteThemeWithBrand } from "@/lib/site-builder/theme-presets";
import type { TenantScope } from "@/types/communication";
import type {
  CreateSiteBuildJobInput,
  SiteBuildJob,
  SiteGenerationProgress,
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

/** Full ARIA-style specialist pipeline with optional progress callbacks. */
export async function generateSitePlan(
  job: SiteBuildJob,
  onProgress?: (event: PipelineProgressEvent) => void | Promise<void>
): Promise<SiteBuildJob> {
  const now = crmNow();
  const planning: SiteBuildJob = {
    ...job,
    status: "generating",
    error: undefined,
    progress: {
      stage: "business",
      percent: 0,
      message: "Starting…",
      updatedAt: now,
    },
    updatedAt: now,
  };

  try {
    const result = await runGenerationPipeline(planning, onProgress);
    return result.job;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Site generation failed.";
    return {
      ...planning,
      status: "failed",
      error: message,
      progress: {
        stage: "done",
        percent: 100,
        message,
        updatedAt: crmNow(),
      },
      updatedAt: crmNow(),
    };
  }
}

/** Legacy plan-only path (kept for approve flow compatibility). */
export async function generatePlanOnly(job: SiteBuildJob): Promise<SiteBuildJob> {
  const now = crmNow();
  try {
    const { plan, usedAi } = await planSiteFromPreferences(job.preferences);
    return {
      ...job,
      status: "plan_ready",
      plan,
      usedAi,
      error: undefined,
      updatedAt: now,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Site planning failed.";
    return {
      ...job,
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

/** Wipe plan/site — used before a full regenerate. */
export function updateSitePreferences(
  job: SiteBuildJob,
  preferences: SitePreferences
): SiteBuildJob {
  return {
    ...job,
    preferences,
    plan: undefined,
    generatedSite: undefined,
    progress: undefined,
    usedAi: undefined,
    approvedAt: undefined,
    status: "draft",
    error: undefined,
    updatedAt: crmNow(),
  };
}

/**
 * Persist an in-progress draft without regenerating.
 * Keeps an existing generated preview (and only refreshes its theme).
 */
export function persistDraftPreferences(
  job: SiteBuildJob,
  preferences: SitePreferences
): SiteBuildJob {
  const theme = resolveSiteThemeWithBrand(preferences);
  const keepGenerated = Boolean(job.generatedSite);

  return {
    ...job,
    preferences,
    status: keepGenerated ? "generated" : "draft",
    plan: job.plan ? { ...job.plan, theme } : undefined,
    generatedSite: job.generatedSite
      ? { ...job.generatedSite, theme }
      : undefined,
    error: keepGenerated ? job.error : undefined,
    updatedAt: crmNow(),
  };
}

export function withProgress(
  job: SiteBuildJob,
  progress: SiteGenerationProgress
): SiteBuildJob {
  return {
    ...job,
    progress,
    status: progress.stage === "done" ? job.status : "generating",
    updatedAt: crmNow(),
  };
}

/** Re-generate site content from an existing plan (non-streaming helper). */
export async function regenerateFromPlan(job: SiteBuildJob): Promise<SiteBuildJob> {
  if (!job.plan) {
    return generateSitePlan(job);
  }
  try {
    const { site, usedAi } = await generateSiteFromPlan(job.plan, job.preferences);
    return {
      ...job,
      status: "generated",
      generatedSite: site,
      usedAi,
      error: undefined,
      updatedAt: crmNow(),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Site generation failed.";
    return {
      ...job,
      status: "failed",
      error: message,
      updatedAt: crmNow(),
    };
  }
}

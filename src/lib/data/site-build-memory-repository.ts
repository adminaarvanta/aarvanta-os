import { crmNow, crmNewId, inCrmScope } from "@/lib/data/crm-helpers";
import type { SiteBuildRepository } from "@/lib/data/site-build-repository";
import type { TenantScope } from "@/types/communication";
import type { SiteBuildJob, SitePreferences } from "@/types/site-builder";

const jobs: SiteBuildJob[] = [];

export const siteBuildMemoryRepository: SiteBuildRepository = {
  async list(scope) {
    return jobs
      .filter((j) => inCrmScope(j, scope))
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async get(id, scope) {
    const item = jobs.find((j) => j.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async save(job) {
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx === -1) {
      jobs.unshift(job);
    } else {
      jobs[idx] = job;
    }
    return job;
  },

  async remove(id, scope) {
    const idx = jobs.findIndex((j) => j.id === id && inCrmScope(j, scope));
    if (idx === -1) return false;
    jobs.splice(idx, 1);
    return true;
  },
};

export function seedSiteBuildJob(
  scope: TenantScope,
  preferences: SitePreferences,
  partial?: Partial<SiteBuildJob>
): SiteBuildJob {
  const now = crmNow();
  return {
    ...scope,
    id: crmNewId("build"),
    status: "draft",
    preferences,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

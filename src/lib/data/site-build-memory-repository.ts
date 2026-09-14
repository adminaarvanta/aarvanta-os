import { crmNow, crmNewId, inCrmScope, persistScope } from "@/lib/data/crm-helpers";
import type { SiteBuildRepository } from "@/lib/data/site-build-repository";
import type { TenantScope } from "@/types/communication";
import type { SiteBuildJob, SitePreferences } from "@/types/site-builder";

/**
 * Persist on globalThis so Turbopack/HMR and RSC vs route-handler module
 * graphs share the same draft list in demo mode. A plain module array is
 * wiped (or forked) on reload — which makes "open existing / resume draft"
 * look broken.
 */
const globalStore = globalThis as typeof globalThis & {
  __aarvantaSiteBuildJobs?: SiteBuildJob[];
};

function jobs(): SiteBuildJob[] {
  if (!globalStore.__aarvantaSiteBuildJobs) {
    globalStore.__aarvantaSiteBuildJobs = [];
  }
  return globalStore.__aarvantaSiteBuildJobs;
}

export const siteBuildMemoryRepository: SiteBuildRepository = {
  async list(scope) {
    return jobs()
      .filter((j) => inCrmScope(j, scope))
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async get(id, scope) {
    const item = jobs().find((j) => j.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async getByShareToken(token) {
    const normalized = token.trim();
    if (!normalized) return null;
    return (
      jobs().find((j) => j.shareToken === normalized && j.generatedSite) ?? null
    );
  },

  async save(job) {
    const list = jobs();
    const idx = list.findIndex((j) => j.id === job.id);
    if (idx === -1) {
      list.unshift(job);
    } else {
      list[idx] = job;
    }
    return job;
  },

  async remove(id, scope) {
    const list = jobs();
    const idx = list.findIndex((j) => j.id === id && inCrmScope(j, scope));
    if (idx === -1) return false;
    list.splice(idx, 1);
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
    ...persistScope(scope),
    id: crmNewId("build"),
    status: "draft",
    preferences,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

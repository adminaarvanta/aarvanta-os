import type { TenantScope } from "@/types/communication";
import type { SiteBuildJob } from "@/types/site-builder";

export type SiteBuildRepository = {
  list(scope: TenantScope): Promise<SiteBuildJob[]>;
  get(id: string, scope: TenantScope): Promise<SiteBuildJob | null>;
  /** Public lookup by share token (no tenant scope). */
  getByShareToken(token: string): Promise<SiteBuildJob | null>;
  save(job: SiteBuildJob): Promise<SiteBuildJob>;
  remove(id: string, scope: TenantScope): Promise<boolean>;
};

import { randomBytes } from "crypto";
import { crmNow } from "@/lib/data/crm-helpers";
import { publicSharePath } from "@/lib/site-builder/share-path";
import type { SiteBuildJob } from "@/types/site-builder";

export { publicSharePath };

export function createShareToken(): string {
  return randomBytes(18).toString("base64url");
}

/** Ensure the job has a share token; returns the (possibly updated) job. */
export function ensureShareToken(job: SiteBuildJob): SiteBuildJob {
  if (job.shareToken) return job;
  return {
    ...job,
    shareToken: createShareToken(),
    updatedAt: crmNow(),
  };
}

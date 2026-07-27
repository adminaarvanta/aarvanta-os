import { randomBytes } from "crypto";
import { crmNow } from "@/lib/data/crm-helpers";
import type { SiteBuildJob } from "@/types/site-builder";

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

export function publicSharePath(token: string): string {
  return `/p/${token}`;
}

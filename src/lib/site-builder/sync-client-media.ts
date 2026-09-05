import { crmNow } from "@/lib/data/crm-helpers";
import type { SiteMediaRepository } from "@/lib/data/site-media-repository";
import {
  applyClientMediaToSite,
  toClientMediaRefs,
} from "@/lib/site-builder/apply-client-media";
import type { SiteBuildJob, SiteClientMedia } from "@/types/site-builder";

export function withClientMediaRefs(
  job: SiteBuildJob,
  media: SiteClientMedia[]
): SiteBuildJob {
  return {
    ...job,
    clientMedia: toClientMediaRefs(media),
    updatedAt: crmNow(),
  };
}

/** Overlay current library photos onto the generated site (stock stays as fallback). */
export function applyLibraryToJob(
  job: SiteBuildJob,
  media: SiteClientMedia[]
): SiteBuildJob {
  const next = withClientMediaRefs(job, media);
  if (!job.generatedSite) return next;
  return {
    ...next,
    generatedSite: applyClientMediaToSite(job.generatedSite, media),
    updatedAt: crmNow(),
  };
}

export async function loadAndApplyClientMedia(
  job: SiteBuildJob,
  repo: SiteMediaRepository
): Promise<SiteBuildJob> {
  const media = await repo.listByJob(job.id, job);
  return applyLibraryToJob(job, media);
}

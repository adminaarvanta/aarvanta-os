import { NextResponse } from "next/server";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getSiteMediaRepository } from "@/lib/data/site-media-store";
import { persistDraftPreferences } from "@/lib/site-builder/orchestrate";
import { normalizeSitePreferences } from "@/lib/site-builder/normalize-preferences";
import { siteDraftPreferencesSchema } from "@/lib/site-builder/schemas";
import { getTenantScope } from "@/lib/tenant/context";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const job = await getSiteBuildRepository().get(id, scope);
  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Build job not found." } },
      { status: 404 }
    );
  }

  const media = await getSiteMediaRepository().listByJob(id, scope);
  return NextResponse.json({ job: { ...job, clientMedia: media } });
}

/** Save draft preferences without regenerating the site. */
export async function PATCH(req: Request, context: RouteContext) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const repo = getSiteBuildRepository();
  const job = await repo.get(id, scope);
  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Build job not found." } },
      { status: 404 }
    );
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = siteDraftPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  // Merge with the saved draft so PATCH from the wizard cannot wipe design
  // options, brand, or site-type priors needed for refine / resume.
  const preferences = normalizeSitePreferences({
    ...parsed.data,
    categoryId:
      parsed.data.categoryId ??
      job.preferences.categoryId ??
      "professional",
    templateId:
      parsed.data.templateId ??
      job.preferences.templateId ??
      "local_trust",
    siteType: parsed.data.siteType ?? job.preferences.siteType,
    ctaGoal: parsed.data.ctaGoal ?? job.preferences.ctaGoal,
    pages: parsed.data.pages?.length ? parsed.data.pages : job.preferences.pages,
    designOptions: parsed.data.designOptions?.length
      ? parsed.data.designOptions
      : job.preferences.designOptions,
    selectedDesignOptionId:
      parsed.data.selectedDesignOptionId ??
      job.preferences.selectedDesignOptionId,
    businessProfile:
      parsed.data.businessProfile ?? job.preferences.businessProfile,
    brandSystem: parsed.data.brandSystem ?? job.preferences.brandSystem,
    pageCandidates:
      parsed.data.pageCandidates ?? job.preferences.pageCandidates,
    // Preserve previously stored screenshots if client omits them (size/local cache).
    referenceScreenshots:
      parsed.data.referenceScreenshots?.length
        ? parsed.data.referenceScreenshots
        : job.preferences.referenceScreenshots ?? [],
  });

  // Avoid blowing Firestore 1MB docs — drop heavy screenshots from draft patches.
  const slimPreferences = {
    ...preferences,
    referenceScreenshots: [],
  };

  const saved = await repo.save(persistDraftPreferences(job, slimPreferences));
  return NextResponse.json({ job: saved });
}

export async function DELETE(_req: Request, context: RouteContext) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  await getSiteMediaRepository().removeByJob(id, scope);
  const removed = await getSiteBuildRepository().remove(id, scope);
  if (!removed) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Build job not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

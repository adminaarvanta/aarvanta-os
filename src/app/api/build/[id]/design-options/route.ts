import { NextResponse } from "next/server";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getSiteMediaRepository } from "@/lib/data/site-media-store";
import { withClientMediaRefs } from "@/lib/site-builder/sync-client-media";
import {
  proposeDesignOptions,
  updateSitePreferences,
} from "@/lib/site-builder/orchestrate";
import { normalizeSitePreferences } from "@/lib/site-builder/normalize-preferences";
import { sitePreferencesSchema } from "@/lib/site-builder/schemas";
import { getTenantScope } from "@/lib/tenant/context";

type RouteContext = { params: Promise<{ id: string }> };

/** Generate ≥3 homepage design options for the user to pick. */
export async function POST(req: Request, context: RouteContext) {
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

  // refreshSeed/previousOptionNames aren't part of SitePreferences — pull them out
  // before schema validation so a "Refresh designs" request doesn't fail parsing.
  let refreshSeed: string | undefined;
  let previousOptionNames: string[] | undefined;
  let preferencesBody: Record<string, unknown> | undefined;
  if (body && typeof body === "object") {
    const raw = { ...(body as Record<string, unknown>) };
    if (typeof raw.refreshSeed === "string" && raw.refreshSeed.trim()) {
      refreshSeed = raw.refreshSeed.trim();
    }
    if (Array.isArray(raw.previousOptionNames)) {
      previousOptionNames = raw.previousOptionNames.filter(
        (n): n is string => typeof n === "string" && n.trim().length > 0
      );
    }
    delete raw.refreshSeed;
    delete raw.previousOptionNames;
    preferencesBody = raw;
  }

  const library = await getSiteMediaRepository().listByJob(id, scope);
  let working = withClientMediaRefs(job, library);
  if (preferencesBody && Object.keys(preferencesBody).length > 0) {
    const parsed = sitePreferencesSchema.safeParse(preferencesBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 }
      );
    }
    working = withClientMediaRefs(
      updateSitePreferences(working, normalizeSitePreferences(parsed.data)),
      library
    );
  }

  const next = await proposeDesignOptions(working, { refreshSeed, previousOptionNames });
  await repo.save(next);

  if (next.status === "failed") {
    return NextResponse.json(
      { error: { code: "DESIGN_FAILED", message: next.error ?? "Failed" }, job: next },
      { status: 500 }
    );
  }

  return NextResponse.json({
    job: next,
    options: next.preferences.designOptions ?? [],
    usedAi: next.usedAi ?? false,
  });
}

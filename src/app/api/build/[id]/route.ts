import { NextResponse } from "next/server";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
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

  return NextResponse.json({ job });
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

  const preferences = normalizeSitePreferences({
    ...parsed.data,
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
  const removed = await getSiteBuildRepository().remove(id, scope);
  if (!removed) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Build job not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

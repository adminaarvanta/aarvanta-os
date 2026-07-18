import { NextResponse } from "next/server";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { createSiteBuildJob, generateSitePlan } from "@/lib/site-builder/orchestrate";
import { normalizeSitePreferences } from "@/lib/site-builder/normalize-preferences";
import {
  siteBuildWriteSchema,
  siteDraftPreferencesSchema,
  sitePreferencesSchema,
} from "@/lib/site-builder/schemas";
import { getTenantScope } from "@/lib/tenant/context";

function stripMode(body: Record<string, unknown>) {
  const { mode: _mode, ...rest } = body;
  return rest;
}

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const jobs = await getSiteBuildRepository().list(scope);
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Expected JSON object." } },
      { status: 400 }
    );
  }

  const write = siteBuildWriteSchema.safeParse(body);
  const mode = write.success ? write.data.mode : "generate";
  const prefsInput = stripMode(body as Record<string, unknown>);

  if (mode === "draft") {
    const parsed = siteDraftPreferencesSchema.safeParse(prefsInput);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 }
      );
    }
    // Keep server docs small — screenshots stay in the browser draft cache.
    const preferences = normalizeSitePreferences({
      ...parsed.data,
      referenceScreenshots: [],
    });
    const draft = createSiteBuildJob(preferences, scope);
    await getSiteBuildRepository().save(draft);
    return NextResponse.json({ job: draft, usedAi: false }, { status: 201 });
  }

  const parsed = sitePreferencesSchema.safeParse(prefsInput);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const preferences = normalizeSitePreferences(parsed.data);
  const draft = createSiteBuildJob(preferences, scope);
  const planned = await generateSitePlan(draft);
  await getSiteBuildRepository().save(planned);

  return NextResponse.json(
    { job: planned, usedAi: planned.usedAi ?? false },
    { status: 201 }
  );
}

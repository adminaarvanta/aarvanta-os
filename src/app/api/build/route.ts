import { NextResponse } from "next/server";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { createSiteBuildJob, generateSitePlan } from "@/lib/site-builder/orchestrate";
import { normalizeSitePreferences } from "@/lib/site-builder/normalize-preferences";
import { sitePreferencesSchema } from "@/lib/site-builder/schemas";
import { getTenantScope } from "@/lib/tenant/context";

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

  const parsed = sitePreferencesSchema.safeParse(body);
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

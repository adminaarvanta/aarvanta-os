import { NextResponse } from "next/server";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
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

  let working = job;
  if (body && typeof body === "object" && Object.keys(body as object).length > 0) {
    const parsed = sitePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 }
      );
    }
    working = updateSitePreferences(job, normalizeSitePreferences(parsed.data));
  }

  const next = await proposeDesignOptions(working);
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

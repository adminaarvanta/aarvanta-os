import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getSiteMediaRepository } from "@/lib/data/site-media-store";
import { loadAndApplyClientMedia } from "@/lib/site-builder/sync-client-media";
import { getTenantScope } from "@/lib/tenant/context";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const jobRepo = getSiteBuildRepository();
  const job = await jobRepo.get(id, scope);
  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Build job not found." } },
      { status: 404 }
    );
  }

  const saved = await jobRepo.save(
    await loadAndApplyClientMedia(job, getSiteMediaRepository())
  );
  return NextResponse.json({ job: saved });
}

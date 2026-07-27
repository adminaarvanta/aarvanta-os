import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import {
  ensureShareToken,
  publicSharePath,
} from "@/lib/site-builder/share-token";
import { getTenantScope } from "@/lib/tenant/context";

type RouteContext = { params: Promise<{ id: string }> };

/** Mint (or return) a public share token for the generated site. */
export async function POST(_req: Request, context: RouteContext) {
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
  if (!job.generatedSite) {
    return NextResponse.json(
      { error: { code: "NOT_READY", message: "Generate a site before sharing." } },
      { status: 400 }
    );
  }

  const withToken = ensureShareToken(job);
  const saved = withToken.shareToken !== job.shareToken ? await repo.save(withToken) : job;
  const path = publicSharePath(saved.shareToken!);

  return NextResponse.json({
    job: saved,
    shareToken: saved.shareToken,
    path,
  });
}

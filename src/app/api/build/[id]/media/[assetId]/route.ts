import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getSiteMediaRepository } from "@/lib/data/site-media-store";
import { applyLibraryToJob } from "@/lib/site-builder/sync-client-media";
import { siteMediaPatchSchema } from "@/lib/site-builder/schemas";
import { parseJsonBody } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; assetId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id, assetId } = await context.params;
  const blob = await getSiteMediaRepository().getBlob(id, assetId);
  if (!blob) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Photo not found." } },
      { status: 404 }
    );
  }

  const bytes = Buffer.from(blob.dataBase64, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": blob.mimeType || "image/jpeg",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id, assetId } = await context.params;
  const jobRepo = getSiteBuildRepository();
  const job = await jobRepo.get(id, scope);
  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Build job not found." } },
      { status: 404 }
    );
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = siteMediaPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const mediaRepo = getSiteMediaRepository();
  const updated = await mediaRepo.update(id, assetId, scope, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Photo not found." } },
      { status: 404 }
    );
  }

  const media = await mediaRepo.listByJob(id, scope);
  const saved = await jobRepo.save(applyLibraryToJob(job, media));
  return NextResponse.json({ media: updated, job: saved });
}

export async function DELETE(_req: Request, context: RouteContext) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id, assetId } = await context.params;
  const jobRepo = getSiteBuildRepository();
  const job = await jobRepo.get(id, scope);
  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Build job not found." } },
      { status: 404 }
    );
  }

  const mediaRepo = getSiteMediaRepository();
  const removed = await mediaRepo.remove(id, assetId, scope);
  if (!removed) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Photo not found." } },
      { status: 404 }
    );
  }

  const media = await mediaRepo.listByJob(id, scope);
  const saved = await jobRepo.save(applyLibraryToJob(job, media));
  return NextResponse.json({ ok: true, job: saved });
}

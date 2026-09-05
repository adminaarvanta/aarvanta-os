import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getSiteMediaRepository } from "@/lib/data/site-media-store";
import { applyLibraryToJob } from "@/lib/site-builder/sync-client-media";
import { SITE_MEDIA_MAX_BYTES } from "@/lib/site-builder/media-constants";
import { siteMediaRoleSchema } from "@/lib/site-builder/schemas";
import { getTenantScope } from "@/lib/tenant/context";
import type { SiteMediaRole } from "@/types/site-builder";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
  return NextResponse.json({ media });
}

export async function POST(req: Request, context: RouteContext) {
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Expected multipart form data." } },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Choose a photo to upload." } },
      { status: 400 }
    );
  }

  const mimeType = file.type || "image/jpeg";
  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Use a JPEG, PNG, or WebP photo." } },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > SITE_MEDIA_MAX_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: `Photo must be under ${Math.round(SITE_MEDIA_MAX_BYTES / 1024)}KB after compression.`,
        },
      },
      { status: 400 }
    );
  }

  const roleParse = siteMediaRoleSchema.safeParse(
    String(form.get("role") || "general")
  );
  const role: SiteMediaRole = roleParse.success ? roleParse.data : "general";
  const caption = String(form.get("caption") || "").trim() || undefined;
  const name = (file.name || "photo.jpg").slice(0, 180);

  const mediaRepo = getSiteMediaRepository();
  try {
    const item = await mediaRepo.create(
      { jobId: id, name, mimeType, role, caption, bytes },
      scope
    );
    const media = await mediaRepo.listByJob(id, scope);
    const saved = await jobRepo.save(applyLibraryToJob(job, media));
    return NextResponse.json({ media: item, job: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "UPLOAD_FAILED",
          message: error instanceof Error ? error.message : "Upload failed.",
        },
      },
      { status: 400 }
    );
  }
}

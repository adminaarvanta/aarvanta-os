import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";

const patchSchema = z.object({
  hasSeenWalkthrough: z.boolean().optional(),
});

export async function GET() {
  try {
    const ctx = await getSessionContext();
    return NextResponse.json({
      hasSeenWalkthrough: Boolean(ctx.member?.hasSeenWalkthrough),
      walkthroughCompletedAt: ctx.member?.walkthroughCompletedAt ?? null,
      userId: ctx.userId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getSessionContext();
    if (!ctx.member) {
      return apiError("NOT_FOUND", "Membership not found", 404);
    }

    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid preferences payload", 400);
    }

    const patch: {
      hasSeenWalkthrough?: boolean;
      walkthroughCompletedAt?: string;
    } = {};

    if (typeof parsed.data.hasSeenWalkthrough === "boolean") {
      patch.hasSeenWalkthrough = parsed.data.hasSeenWalkthrough;
      if (parsed.data.hasSeenWalkthrough) {
        patch.walkthroughCompletedAt = new Date().toISOString();
      }
    }

    if (Object.keys(patch).length === 0) {
      return apiError("VALIDATION_ERROR", "No preferences to update", 400);
    }

    const repo = getTenantRepository();
    const updated = await repo.updateMemberPreferences(
      ctx.member.id,
      patch,
      ctx.scope
    );
    if (!updated) {
      return apiError("NOT_FOUND", "Membership not found", 404);
    }

    return NextResponse.json({
      ok: true,
      hasSeenWalkthrough: Boolean(updated.hasSeenWalkthrough),
      walkthroughCompletedAt: updated.walkthroughCompletedAt ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  alternativesForAction,
  lossCopyForAction,
  type AccountLifecycleAction,
} from "@/lib/account/lifecycle";
import {
  applyAccountLifecycleAction,
  getAccountLifecycle,
  resumeAccountLifecycle,
} from "@/lib/account/lifecycle-store";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSessionContext, requirePermission } from "@/lib/tenant/context";

export const runtime = "nodejs";

const actionSchema = z.enum([
  "pause",
  "cancel",
  "downgrade",
  "deactivate",
  "delete",
]);

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const lifecycle = await getAccountLifecycle(ctx.scope.tenantId);
    return NextResponse.json({
      lifecycle,
      alternatives: {
        pause: alternativesForAction("pause"),
        cancel: alternativesForAction("cancel"),
        downgrade: alternativesForAction("downgrade"),
        deactivate: alternativesForAction("deactivate"),
        delete: alternativesForAction("delete"),
      },
      lossCopy: {
        pause: lossCopyForAction("pause"),
        cancel: lossCopyForAction("cancel"),
        downgrade: lossCopyForAction("downgrade"),
        deactivate: lossCopyForAction("deactivate"),
        delete: lossCopyForAction("delete"),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed.";
    if (message === "Unauthorized") return unauthorized();
    return apiError("LIFECYCLE_ERROR", message, 500);
  }
}

const patchSchema = z.object({
  action: actionSchema,
  reason: z.string().max(400).optional(),
  selectedAlternative: z
    .enum([
      "pause",
      "downgrade",
      "keep_plan",
      "talk_support",
      "download_data",
      "change_plan",
    ])
    .optional(),
  confirm: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requirePermission("org:manage");
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid request.",
        400
      );
    }

    const action: AccountLifecycleAction = parsed.data.action;
    if (action === "delete" && !parsed.data.confirm) {
      return apiError(
        "CONFIRMATION_REQUIRED",
        "Download your data, then confirm deletion. This cannot be undone.",
        400
      );
    }

    const lifecycle = await applyAccountLifecycleAction({
      tenantId: ctx.scope.tenantId,
      action,
      reason: parsed.data.reason,
      selectedAlternative: parsed.data.selectedAlternative,
    });

    return NextResponse.json({
      lifecycle,
      alternatives: alternativesForAction(action),
      lossCopy: lossCopyForAction(action),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    if (message === "Unauthorized") return unauthorized();
    if (message === "Forbidden") {
      return apiError("FORBIDDEN", "Only an owner or admin can change account status.", 403);
    }
    return apiError("LIFECYCLE_ERROR", message, 500);
  }
}

export async function POST() {
  try {
    await requirePermission("org:manage");
    const ctx = await getSessionContext();
    const lifecycle = await resumeAccountLifecycle(ctx.scope.tenantId);
    return NextResponse.json({ lifecycle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume failed.";
    if (message === "Unauthorized") return unauthorized();
    if (message === "Forbidden") {
      return apiError("FORBIDDEN", "Only an owner or admin can resume the account.", 403);
    }
    return apiError("LIFECYCLE_ERROR", message, 500);
  }
}

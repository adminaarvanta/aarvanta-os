import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getAllChannelStatuses } from "@/lib/channels/config";
import { apiError, parseJsonBody } from "@/lib/api/request";
import {
  getEmailInboundConfig,
  checkGmailSyncAccess,
} from "@/lib/channels/gmail-client";
import { getActiveDatastore } from "@/lib/data/datastore";
import { isProductionMode } from "@/lib/config/app-mode";
import {
  getWorkspaceSettings,
  setWorkspaceSettings,
} from "@/lib/settings/workspace-settings";
import { getSessionContext, requirePermission } from "@/lib/tenant/context";

const patchSchema = z.object({
  inboxAutomationEnabled: z.boolean().optional(),
  aiAutoSummarize: z.boolean().optional(),
  crmQualificationThreshold: z.number().int().min(0).max(100).optional(),
});

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const [settings, gmailSyncStatus] = await Promise.all([
      getWorkspaceSettings(ctx.scope.workspaceId),
      checkGmailSyncAccess(),
    ]);

    return NextResponse.json({
      settings,
      system: {
        mode: isProductionMode() ? "production" : "demo",
        datastore: getActiveDatastore(),
        ai: getAiRuntimeStatus(),
        channels: getAllChannelStatuses(),
        emailInbound: { ...getEmailInboundConfig(), gmailSyncStatus },
      },
      scope: ctx.scope,
      user: {
        email: ctx.email,
        name: ctx.name,
        role: ctx.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("SETTINGS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requirePermission("workspace:manage");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid settings payload", 400);
    }

    const settings = await setWorkspaceSettings(
      ctx.scope.workspaceId,
      parsed.data
    );

    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("SETTINGS_ERROR", message, status);
  }
}

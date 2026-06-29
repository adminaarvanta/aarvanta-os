import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getHrWorkspaceSettings, setHrWorkspaceSettings } from "@/lib/hr/settings";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const settings = getHrWorkspaceSettings(ctx.scope.workspaceId);
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("HR_SETTINGS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

const patchSchema = z.object({
  inboxAutomationEnabled: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid settings payload", 400);
  }

  const settings = setHrWorkspaceSettings(ctx.scope.workspaceId, parsed.data);
  return NextResponse.json({ settings });
}

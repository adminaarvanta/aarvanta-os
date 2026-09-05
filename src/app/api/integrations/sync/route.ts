import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { syncUserGoogleCalendar } from "@/lib/calendar/google-calendar";
import { assertActiveMember } from "@/lib/calendar/user-calendar";
import { getIntegrationRepository } from "@/lib/data/integration-store";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.object({
  provider: z.enum([
    "gmail",
    "outlook",
    "google_calendar",
    "google_drive",
    "slack",
    "whatsapp_cloud",
    "stripe",
  ]),
});

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid sync payload", 400);
    }

    if (parsed.data.provider === "google_calendar") {
      assertActiveMember(ctx);
    }

    const userId =
      parsed.data.provider === "google_calendar" ? ctx.userId : undefined;

    const repo = getIntegrationRepository();
    const connection =
      parsed.data.provider === "google_calendar"
        ? await syncUserGoogleCalendar(ctx.scope, ctx.userId)
        : await repo.sync(
            ctx.scope.tenantId,
            ctx.scope.workspaceId,
            parsed.data.provider,
            userId
          );
    if (!connection) {
      return apiError("BAD_REQUEST", "Integration not connected", 400);
    }
    return NextResponse.json(connection);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return apiError(
      "INTEGRATION_ERROR",
      message,
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    );
  }
}

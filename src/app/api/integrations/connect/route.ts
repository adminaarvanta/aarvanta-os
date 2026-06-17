import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
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
  accountLabel: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid connect payload", 400);
    }

    const repo = getIntegrationRepository();
    const connection = await repo.connect(
      ctx.scope.tenantId,
      ctx.scope.workspaceId,
      parsed.data.provider,
      parsed.data.accountLabel
    );
    return NextResponse.json(connection);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connect failed";
    return apiError("INTEGRATION_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid disconnect payload", 400);
    }

    const repo = getIntegrationRepository();
    const connection = await repo.disconnect(
      ctx.scope.tenantId,
      ctx.scope.workspaceId,
      parsed.data.provider
    );
    if (!connection) return apiError("NOT_FOUND", "Integration not found", 404);
    return NextResponse.json(connection);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Disconnect failed";
    return apiError("INTEGRATION_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

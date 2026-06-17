import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { INTEGRATION_DEFINITIONS } from "@/lib/data/integration-demo-seed";
import { getIntegrationRepository } from "@/lib/data/integration-store";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getIntegrationRepository();
    const connections = await repo.listConnections(
      ctx.scope.tenantId,
      ctx.scope.workspaceId
    );
    const providers = INTEGRATION_DEFINITIONS.map((def) => {
      const conn = connections.find((c) => c.provider === def.provider);
      return { ...def, connection: conn ?? null };
    });
    return NextResponse.json({ providers, connections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("INTEGRATION_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

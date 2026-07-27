import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";
import { getDirectoryAgentCards } from "@/lib/workforce/pipeline/agent-status";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const agents = await getDirectoryAgentCards(ctx.scope);
    return NextResponse.json({ agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("WORKFORCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

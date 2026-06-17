import { NextResponse } from "next/server";
import { getWorkforceUpgradeRepository } from "@/lib/data/workforce-upgrade-store";
import { getSessionContext } from "@/lib/tenant/context";
import { apiError } from "@/lib/api/request";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getWorkforceUpgradeRepository();
    const [sharedMemory, collaborations] = await Promise.all([
      repo.listSharedMemory(ctx.scope),
      repo.listCollaborations(ctx.scope),
    ]);
    return NextResponse.json({ sharedMemory, collaborations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("WORKFORCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

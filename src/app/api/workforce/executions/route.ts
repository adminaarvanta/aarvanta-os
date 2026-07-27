import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import {
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
} from "@/lib/data/workforce-pipeline-store";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  try {
    const ctx = await getSessionContext();
    const status = new URL(req.url).searchParams.get("status");
    let executions = await getWorkforceExecutionsStore().list(ctx.scope);
    if (status) {
      executions = executions.filter((e) => e.status === status);
    }
    executions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const goals = await getWorkforceGoalsStore().list(ctx.scope);
    const goalMap = new Map(goals.map((g) => [g.id, g]));

    return NextResponse.json({
      executions: executions.map((e) => ({
        ...e,
        goal: goalMap.get(e.goalId) ?? null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("WORKFORCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

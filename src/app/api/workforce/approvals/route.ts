import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import {
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
} from "@/lib/data/workforce-pipeline-store";
import { getSessionContext } from "@/lib/tenant/context";
import { listPendingApprovals } from "@/lib/workforce/pipeline/approvals";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const pending = await listPendingApprovals(ctx.scope);
    const executions = await getWorkforceExecutionsStore().list(ctx.scope);
    const goals = await getWorkforceGoalsStore().list(ctx.scope);
    const execMap = new Map(executions.map((e) => [e.id, e]));
    const goalMap = new Map(goals.map((g) => [g.id, g]));

    return NextResponse.json({
      approvals: pending.map((a) => {
        const execution = execMap.get(a.executionId) ?? null;
        const goal = execution ? goalMap.get(execution.goalId) ?? null : null;
        return { ...a, execution, goal };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError(
      "WORKFORCE_ERROR",
      message,
      message === "Unauthorized" ? 401 : 500
    );
  }
}

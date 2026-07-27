import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import {
  getWorkforceApprovalsStore,
  getWorkforceContextsStore,
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
  getWorkforceReportsStore,
} from "@/lib/data/workforce-pipeline-store";
import { getSessionContext } from "@/lib/tenant/context";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const ctx = await getSessionContext();
    const { id } = await params;
    const execution = await getWorkforceExecutionsStore().get(id, ctx.scope);
    if (!execution) {
      return apiError("NOT_FOUND", "Execution not found", 404);
    }

    const [goal, context, report, approvals] = await Promise.all([
      getWorkforceGoalsStore().get(execution.goalId, ctx.scope),
      execution.contextPackageId
        ? getWorkforceContextsStore().get(execution.contextPackageId, ctx.scope)
        : Promise.resolve(null),
      execution.reportId
        ? getWorkforceReportsStore().get(execution.reportId, ctx.scope)
        : Promise.resolve(null),
      getWorkforceApprovalsStore().list(ctx.scope).then((all) =>
        all.filter((a) => a.executionId === execution.id)
      ),
    ]);

    return NextResponse.json({
      execution,
      goal,
      context,
      report,
      approvals,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("WORKFORCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

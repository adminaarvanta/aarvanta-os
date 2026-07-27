import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import {
  getWorkforceApprovalsStore,
  getWorkforceExecutionsStore,
} from "@/lib/data/workforce-pipeline-store";
import { getSessionContext } from "@/lib/tenant/context";
import { resolveApproval } from "@/lib/workforce/pipeline/approvals";
import { resumeExecutionAfterApproval } from "@/lib/workforce/pipeline/orchestrator";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  approvalId: z.string().min(1),
  resolution: z.enum(["approved", "rejected", "modified"]),
  modifiedOffer: z.string().optional(),
});

export async function POST(req: Request, { params }: Params) {
  try {
    const ctx = await getSessionContext();
    const { id: executionId } = await params;
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid approval payload", 400);
    }

    const execution = await getWorkforceExecutionsStore().get(
      executionId,
      ctx.scope
    );
    if (!execution) {
      return apiError("NOT_FOUND", "Execution not found", 404);
    }

    const approval = await getWorkforceApprovalsStore().get(
      parsed.data.approvalId,
      ctx.scope
    );
    if (!approval || approval.executionId !== executionId) {
      return apiError("NOT_FOUND", "Approval not found for this execution", 404);
    }

    if (
      parsed.data.resolution === "modified" &&
      !parsed.data.modifiedOffer?.trim()
    ) {
      return apiError(
        "VALIDATION_ERROR",
        "modifiedOffer is required when resolution is modified",
        400
      );
    }

    const { approval: updated, decisionLabel } = await resolveApproval({
      scope: ctx.scope,
      approvalId: parsed.data.approvalId,
      resolution: parsed.data.resolution,
      modifiedOffer: parsed.data.modifiedOffer,
      resolvedBy: ctx.name,
    });

    const resumed = await resumeExecutionAfterApproval({
      scope: ctx.scope,
      executionId,
      humanDecision: decisionLabel,
    });

    return NextResponse.json({ approval: updated, execution: resumed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approve failed";
    return apiError("WORKFORCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

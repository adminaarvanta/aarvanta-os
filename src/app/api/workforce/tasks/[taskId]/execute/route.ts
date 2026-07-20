import { NextResponse } from "next/server";
import { z } from "zod";
import { AiNotConfiguredError, AiRequestError } from "@/lib/ai/provider";
import { executeCrmTaskForAgent } from "@/lib/workforce/execute-crm-task";
import { isAgentType } from "@/lib/workforce/agents";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

export const runtime = "nodejs";

const bodySchema = z.object({
  agentType: z.string().optional(),
  applyFollowUpTasks: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { taskId } = await params;
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const agentType =
    parsed.data.agentType && isAgentType(parsed.data.agentType)
      ? parsed.data.agentType
      : undefined;

  try {
    const result = await executeCrmTaskForAgent({
      taskId,
      scope,
      agentType,
      applyFollowUpTasks: parsed.data.applyFollowUpTasks,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to execute task";
    const status =
      error instanceof AiNotConfiguredError
        ? 503
        : error instanceof AiRequestError
          ? 502
          : message.includes("not found")
            ? 404
            : message.includes("already completed") ||
                message.includes("not assigned")
              ? 400
              : 500;
    return NextResponse.json(
      { error: { code: "TASK_EXECUTE_FAILED", message } },
      { status }
    );
  }
}

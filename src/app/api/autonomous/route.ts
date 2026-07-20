import { NextResponse } from "next/server";
import { z } from "zod";
import { getAutonomousStore } from "@/lib/data/platform-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";
import { isAgentType } from "@/lib/workforce/agents";
import { executeCrmTaskForAgent } from "@/lib/workforce/execute-crm-task";
import { AGENT_TYPE_ZOD } from "@/lib/workforce/agent-types";

const createTaskSchema = z.object({
  agentType: z.enum(AGENT_TYPE_ZOD),
  goal: z.string().min(1),
  steps: z.array(z.string().min(1)).optional(),
  requiresApproval: z.boolean().optional(),
  /** When true (default), run the agent against a linked CRM task immediately. */
  executeNow: z.boolean().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
});

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const tasks = await getAutonomousStore().list(ctx.scope);
    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("AUTONOMOUS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const store = getAutonomousStore();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid autonomous task payload", 400);
    }

    if (!isAgentType(parsed.data.agentType)) {
      return apiError("VALIDATION_ERROR", "Invalid agent type", 400);
    }

    const createdAt = new Date().toISOString();
    let task = await store.create({
      ...ctx.scope,
      agentType: parsed.data.agentType,
      goal: parsed.data.goal,
      steps: parsed.data.steps ?? [],
      requiresApproval: parsed.data.requiresApproval ?? false,
      status: "queued",
      createdAt,
    });

    // Mirror into CRM so workforce agents have a real completable work unit.
    const crmTask = await getCrmRepository().createTask(
      {
        title: parsed.data.goal,
        description:
          parsed.data.steps && parsed.data.steps.length > 0
            ? `Autonomous steps:\n- ${parsed.data.steps.join("\n- ")}`
            : "Queued from Autonomous Task Queue",
        priority: "medium",
        contactId: parsed.data.contactId,
        dealId: parsed.data.dealId,
        assignedAgentType: parsed.data.agentType,
        source: "ai",
      },
      ctx.scope
    );

    const executeNow =
      parsed.data.executeNow !== false && !parsed.data.requiresApproval;

    if (executeNow) {
      task = {
        ...task,
        status: "executing",
      };
      await store.set(task);

      try {
        const result = await executeCrmTaskForAgent({
          taskId: crmTask.id,
          scope: ctx.scope,
          agentType: parsed.data.agentType,
        });
        task = {
          ...task,
          status: "completed",
          steps:
            task.steps.length > 0
              ? task.steps
              : [
                  result.run.summary.slice(0, 120),
                  ...result.applied.map((a) => a.message).slice(0, 3),
                ],
        };
        await store.set(task);
        return NextResponse.json(
          { task, crmTask: result.task, run: result.run },
          { status: 201 }
        );
      } catch (error) {
        task = { ...task, status: "failed" };
        await store.set(task);
        const message =
          error instanceof Error ? error.message : "Execution failed";
        return NextResponse.json(
          { task, crmTask, error: { code: "EXECUTE_FAILED", message } },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ task, crmTask }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return apiError("AUTONOMOUS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

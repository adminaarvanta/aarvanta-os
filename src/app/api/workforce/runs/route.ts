import { NextResponse } from "next/server";
import { z } from "zod";
import { AiNotConfiguredError, AiRequestError } from "@/lib/ai/provider";
import { isAgentType } from "@/lib/workforce/agents";
import { buildWorkforceContext } from "@/lib/workforce/context";
import { executeAgentRun } from "@/lib/workforce/run-agent";
import { saveRunToAgentMemory } from "@/lib/workforce/save-run-memory";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";

const createSchema = z.object({
  agentType: z.string().min(1),
  contactId: z.string().optional(),
  conversationId: z.string().optional(),
});

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const agentType = new URL(req.url).searchParams.get("agentType");
  const runs = await getWorkforceRepository().listRuns(scope, {
    agentType: agentType && isAgentType(agentType) ? agentType : undefined,
    limit: 30,
  });

  return NextResponse.json({ runs });
}

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!isAgentType(parsed.data.agentType)) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  const repo = getWorkforceRepository();
  const agentType = parsed.data.agentType;

  const run = await repo.createRun(
    {
      agentType,
      status: "running",
      trigger: "manual",
      contactId: parsed.data.contactId,
      conversationId: parsed.data.conversationId,
      summary: "",
      recommendations: [],
      actions: [],
    },
    scope
  );

  try {
    const context = await buildWorkforceContext(scope, {
      contactId: parsed.data.contactId,
      conversationId: parsed.data.conversationId,
    });

    const inputParts: string[] = [];
    if (context.contact) inputParts.push(`Contact: ${context.contact.name}`);
    if (context.conversation)
      inputParts.push(`Conversation: ${context.conversation.contactName}`);

    const result = await executeAgentRun({ agentType, context });

    const completed = await repo.updateRun(
      run.id,
      {
        status: "completed",
        summary: result.summary,
        recommendations: result.recommendations,
        actions: result.actions,
        inputSummary: inputParts.join(" · ") || "Business-wide analysis",
        completedAt: crmNow(),
      },
      scope
    );

    if (completed) {
      await saveRunToAgentMemory(completed, scope);
    }

    return NextResponse.json({ run: completed }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof AiNotConfiguredError ||
      error instanceof AiRequestError ||
      error instanceof Error
        ? error.message
        : "Agent run failed";

    await repo.updateRun(
      run.id,
      {
        status: "failed",
        error: message,
        completedAt: crmNow(),
      },
      scope
    );

    const status =
      error instanceof AiNotConfiguredError ? 503 : error instanceof AiRequestError ? 502 : 500;

    return NextResponse.json(
      { error: { code: "AGENT_FAILED", message }, runId: run.id },
      { status }
    );
  }
}

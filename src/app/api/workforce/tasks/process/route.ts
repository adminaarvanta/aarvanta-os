import { NextResponse } from "next/server";
import { z } from "zod";
import { processAgentCrmTasks } from "@/lib/workforce/execute-crm-task";
import { isAgentType } from "@/lib/workforce/agents";
import { AGENT_TYPE_ZOD } from "@/lib/workforce/agent-types";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

export const runtime = "nodejs";

const bodySchema = z.object({
  agentType: z.enum(AGENT_TYPE_ZOD).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

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

  const result = await processAgentCrmTasks({
    scope,
    agentType,
    limit: parsed.data.limit ?? 5,
  });

  return NextResponse.json({
    ok: true,
    processedCount: result.processed.length,
    failedCount: result.failed.length,
    ...result,
  });
}

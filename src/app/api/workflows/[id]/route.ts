import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const triggerSchema = z.object({
  type: z.enum(["manual", "crm_lead_scored", "deal_updated", "schedule"]),
  label: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
});

const stepSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["condition", "agent", "approval", "action", "delay"]),
  label: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  trigger: triggerSchema.optional(),
  steps: z.array(stepSchema).min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const workflow = await getWorkflowRepository().getWorkflow(id, scope);
  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const runs = await getWorkflowRepository().listRuns(scope, id);
  return NextResponse.json({ workflow, runs });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const workflow = await getWorkflowRepository().updateWorkflow(
    id,
    parsed.data,
    ctx.scope
  );
  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ workflow });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const ok = await getWorkflowRepository().deleteWorkflow(id, scope);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

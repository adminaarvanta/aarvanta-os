import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { WORKFLOW_TEMPLATES } from "@/lib/data/workflow-demo-seed";
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

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  templateId: z.string().optional(),
  trigger: triggerSchema,
  steps: z.array(stepSchema).min(1),
  tags: z.array(z.string()).optional(),
});

const fromTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().optional(),
});

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const workflows = await getWorkflowRepository().listWorkflows(scope);
  return NextResponse.json({ workflows, templates: WORKFLOW_TEMPLATES });
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  // Install from template gallery
  const fromTemplate = fromTemplateSchema.safeParse(body);
  if (fromTemplate.success && "templateId" in (body as object) && !("steps" in (body as object))) {
    const template = WORKFLOW_TEMPLATES.find(
      (t) => t.templateId === fromTemplate.data.templateId
    );
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const workflow = await getWorkflowRepository().createWorkflow(
      {
        name: fromTemplate.data.name?.trim() || template.name,
        description: template.description,
        enabled: true,
        templateId: template.templateId,
        trigger: template.trigger,
        steps: template.steps.map((s, i) => ({
          ...s,
          id: `${s.id}_${Date.now()}_${i}`,
        })),
        tags: template.tags,
      },
      ctx.scope
    );
    return NextResponse.json({ workflow }, { status: 201 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const workflow = await getWorkflowRepository().createWorkflow(
    parsed.data,
    ctx.scope
  );
  return NextResponse.json({ workflow }, { status: 201 });
}

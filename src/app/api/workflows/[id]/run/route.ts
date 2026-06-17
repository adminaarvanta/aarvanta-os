import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import {
  defaultDemoContext,
  startWorkflowRun,
} from "@/lib/workflow/execute";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

const schema = z.object({
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  contactName: z.string().optional(),
  leadScore: z.number().optional(),
  dealValue: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const repo = getWorkflowRepository();
  const workflow = await repo.getWorkflow(id, scope);
  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!workflow.enabled) {
    return NextResponse.json({ error: "Workflow is disabled" }, { status: 400 });
  }

  let context = defaultDemoContext(workflow.templateId);
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (parsed.success && Object.keys(parsed.data).length > 0) {
      context = { ...context, ...parsed.data };
    }
  } catch {
    /* empty body uses demo context */
  }

  const run = await startWorkflowRun(scope, workflow, context);
  return NextResponse.json({ run }, { status: 201 });
}

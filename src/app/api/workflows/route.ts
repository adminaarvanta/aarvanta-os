import { NextResponse } from "next/server";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { WORKFLOW_TEMPLATES } from "@/lib/data/workflow-demo-seed";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

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

import { NextResponse } from "next/server";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const workflowId = new URL(req.url).searchParams.get("workflowId") ?? undefined;
  const runs = await getWorkflowRepository().listRuns(scope, workflowId);
  return NextResponse.json({ runs });
}

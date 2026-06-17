import { NextResponse } from "next/server";
import { approveWorkflowRun } from "@/lib/workflow/execute";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function POST(
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
  const run = await approveWorkflowRun(scope, id);
  if (!run) {
    return NextResponse.json(
      { error: "Run not awaiting approval" },
      { status: 400 }
    );
  }

  return NextResponse.json({ run });
}

import { NextResponse } from "next/server";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

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
  const pipeline = await getCrmRepository().getPipeline(id, scope);
  if (!pipeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deals = await getCrmRepository().listDeals(scope, { pipelineId: id });
  return NextResponse.json({ pipeline, deals });
}

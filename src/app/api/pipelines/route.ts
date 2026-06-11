import { NextResponse } from "next/server";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const pipelines = await getCrmRepository().listPipelines(scope);
  return NextResponse.json({ pipelines });
}

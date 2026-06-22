import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { runNinetySecondJourney } from "@/lib/demo/ninety-second-journey";
import { getTenantScope } from "@/lib/tenant/context";

export async function POST() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const result = await runNinetySecondJourney(scope);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

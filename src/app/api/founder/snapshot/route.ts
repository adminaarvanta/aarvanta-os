import { NextResponse } from "next/server";
import { buildFounderSnapshot } from "@/lib/founder/build-snapshot";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const snapshot = await buildFounderSnapshot(scope);
  return NextResponse.json({ snapshot });
}

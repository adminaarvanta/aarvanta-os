import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { isDemoMode } from "@/lib/config/app-mode";
import { runNinetySecondJourney } from "@/lib/demo/ninety-second-journey";
import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { getTenantScope } from "@/lib/tenant/context";
import type { TenantScope } from "@/types/communication";

async function resolveDemoJourneyScope(): Promise<TenantScope | null> {
  if (isDemoMode() || process.env.ENABLE_LIVE_DEMO === "true") {
    try {
      return await getTenantScope();
    } catch {
      return DEMO_TENANT;
    }
  }

  try {
    return await getTenantScope();
  } catch {
    return null;
  }
}

export async function POST() {
  const scope = await resolveDemoJourneyScope();
  if (!scope) {
    return unauthorized();
  }

  const result = await runNinetySecondJourney(scope);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

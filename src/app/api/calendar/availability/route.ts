import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getAvailabilityDays } from "@/lib/calendar/availability";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const timezone = url.searchParams.get("timezone") ?? "America/New_York";
  const days = Number(url.searchParams.get("days") ?? 3) || 3;
  const availability = await getAvailabilityDays({ scope, timezone, days });
  return NextResponse.json({ availability });
}

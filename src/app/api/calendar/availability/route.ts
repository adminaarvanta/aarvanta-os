import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getAvailabilityDays } from "@/lib/calendar/availability";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const timezone = url.searchParams.get("timezone") ?? "America/New_York";
  const days = Number(url.searchParams.get("days") ?? 3) || 3;
  const availability = await getAvailabilityDays({
    scope: ctx.scope,
    timezone,
    days,
    userId: ctx.userId,
  });
  return NextResponse.json({ availability });
}

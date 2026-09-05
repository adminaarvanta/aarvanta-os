import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getDaySlots } from "@/lib/calendar/availability";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
  }
  const timezone = url.searchParams.get("timezone") ?? "America/New_York";
  const slots = await getDaySlots({
    scope: ctx.scope,
    date,
    timezone,
    userId: ctx.userId,
  });
  return NextResponse.json({ slots });
}

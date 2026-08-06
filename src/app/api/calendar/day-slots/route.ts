import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getDaySlots } from "@/lib/calendar/availability";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date required (YYYY-MM-DD)" }, { status: 400 });
  }
  const timezone = url.searchParams.get("timezone") ?? "America/New_York";
  const slots = await getDaySlots({ scope, date, timezone });
  return NextResponse.json({ slots });
}

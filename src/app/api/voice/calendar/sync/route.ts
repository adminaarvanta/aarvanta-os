import { NextResponse } from "next/server";
import { apiError, authErrorResponse, forbidden } from "@/lib/api/request";
import { syncUserGoogleCalendar } from "@/lib/calendar/google-calendar";
import { assertActiveMember } from "@/lib/calendar/user-calendar";
import { getSessionContext } from "@/lib/tenant/context";

export async function POST() {
  try {
    const ctx = await getSessionContext();
    assertActiveMember(ctx);
    const connection = await syncUserGoogleCalendar(ctx.scope, ctx.userId);
    if (!connection) {
      return apiError("BAD_REQUEST", "Connect your calendar before syncing", 400);
    }
    return NextResponse.json({ connection });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Sync failed";
    if (message === "Forbidden") return forbidden();
    return apiError("CALENDAR_ERROR", message, 500);
  }
}

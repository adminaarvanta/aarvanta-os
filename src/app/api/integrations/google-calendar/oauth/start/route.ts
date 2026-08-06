import { NextResponse } from "next/server";
import { getGoogleCalendarAuthUrl } from "@/lib/calendar/google-calendar";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const state = Buffer.from(
      JSON.stringify({
        tenantId: ctx.scope.tenantId,
        workspaceId: ctx.scope.workspaceId,
        companyId: ctx.scope.companyId,
        userId: ctx.userId,
      })
    ).toString("base64url");
    const url = getGoogleCalendarAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth start failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

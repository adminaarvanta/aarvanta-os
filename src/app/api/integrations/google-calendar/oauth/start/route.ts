import { NextResponse } from "next/server";
import { getGoogleCalendarAuthUrl } from "@/lib/calendar/google-calendar";
import { assertActiveMember } from "@/lib/calendar/user-calendar";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    assertActiveMember(ctx);
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
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import {
  apiError,
  authErrorResponse,
  forbidden,
} from "@/lib/api/request";
import { isDemoMode } from "@/lib/config/app-mode";
import { hasLiveGoogleCalendar } from "@/lib/calendar/google-calendar";
import {
  assertActiveMember,
  isGoogleCalendarOAuthConfigured,
  listTeamCalendars,
} from "@/lib/calendar/user-calendar";
import { getIntegrationRepository } from "@/lib/data/integration-store";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    assertActiveMember(ctx);
    const team = await listTeamCalendars(ctx.scope, ctx.userId);
    const mine = team.find((row) => row.isCurrentUser) ?? {
      userId: ctx.userId,
      name: ctx.name,
      email: ctx.email,
      role: ctx.role,
      connected: false,
      isCurrentUser: true,
    };

    return NextResponse.json({
      oauthConfigured: isGoogleCalendarOAuthConfigured(),
      demoMode: isDemoMode(),
      liveSync: await hasLiveGoogleCalendar(ctx.scope, ctx.userId),
      currentUser: mine,
      team,
    });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Load failed";
    if (message === "Forbidden") return forbidden();
    return apiError("CALENDAR_ERROR", message, 500);
  }
}

/** Demo / fallback connect — production with OAuth uses the Google redirect. */
export async function POST() {
  try {
    const ctx = await getSessionContext();
    assertActiveMember(ctx);

    if (isGoogleCalendarOAuthConfigured()) {
      return NextResponse.json({
        redirect: "/api/integrations/google-calendar/oauth/start",
      });
    }

    const repo = getIntegrationRepository();
    const connection = await repo.connect(
      ctx.scope.tenantId,
      ctx.scope.workspaceId,
      "google_calendar",
      ctx.email,
      ctx.userId
    );
    return NextResponse.json({ connection });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Connect failed";
    if (message === "Forbidden") return forbidden();
    return apiError("CALENDAR_ERROR", message, 500);
  }
}

export async function DELETE() {
  try {
    const ctx = await getSessionContext();
    assertActiveMember(ctx);
    const repo = getIntegrationRepository();
    const connection = await repo.disconnect(
      ctx.scope.tenantId,
      ctx.scope.workspaceId,
      "google_calendar",
      ctx.userId
    );
    if (!connection) {
      return apiError("NOT_FOUND", "Calendar is not connected", 404);
    }
    return NextResponse.json({ connection });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Disconnect failed";
    if (message === "Forbidden") return forbidden();
    return apiError("CALENDAR_ERROR", message, 500);
  }
}

import { NextResponse } from "next/server";
import {
  apiError,
  authErrorResponse,
  forbidden,
} from "@/lib/api/request";
import { isDemoMode } from "@/lib/config/app-mode";
import {
  hasCalendarAvailabilitySource,
  looksLikeCalendarMailbox,
  storeGoogleCalendarIcsFeed,
  storeGoogleCalendarInviteMailbox,
} from "@/lib/calendar/google-calendar";
import {
  assertActiveMember,
  isGoogleCalendarOAuthConfigured,
  isGoogleCalendarOAuthPublic,
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
      oauthPublic: isGoogleCalendarOAuthPublic(),
      demoMode: isDemoMode(),
      liveSync: await hasCalendarAvailabilitySource(ctx.scope, ctx.userId),
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

/** Persist invite mailbox (default), iCal feed, or OAuth when publicly enabled. */
export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    assertActiveMember(ctx);

    let icsUrl: string | undefined;
    let mode: string | undefined;
    let email: string | undefined;
    const text = await req.text();
    if (text.trim()) {
      try {
        const body = JSON.parse(text) as {
          icsUrl?: string;
          mode?: string;
          email?: string;
        };
        icsUrl = body.icsUrl?.trim();
        mode = body.mode?.trim();
        email = body.email?.trim();
      } catch {
        return apiError("INVALID_JSON", "Invalid JSON body", 400);
      }
    }

    if (icsUrl) {
      const connection = await storeGoogleCalendarIcsFeed(
        ctx.scope,
        icsUrl,
        ctx.userId
      );
      return NextResponse.json({ connection });
    }

    if (mode === "oauth") {
      if (!isGoogleCalendarOAuthPublic()) {
        return apiError(
          "OAUTH_BLOCKED",
          "Google sign-in is blocked until Aarvanta finishes Google verification. Connect with your calendar email instead.",
          409
        );
      }
      return NextResponse.json({
        redirect: "/api/integrations/google-calendar/oauth/start",
      });
    }

    const mailbox = email || ctx.email;
    if (!looksLikeCalendarMailbox(mailbox)) {
      return apiError(
        "VALIDATION_ERROR",
        "Your account needs an email address to receive calendar invites.",
        400
      );
    }
    const connection = await storeGoogleCalendarInviteMailbox(
      ctx.scope,
      mailbox,
      ctx.userId
    );
    return NextResponse.json({ connection });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Connect failed";
    if (message === "Forbidden") return forbidden();
    const clientError =
      /iCal|calendar link|not allowed|https|credentials|did not return|too large|redirected|email address/i.test(
        message
      );
    return apiError("CALENDAR_ERROR", message, clientError ? 400 : 500);
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

import { NextResponse } from "next/server";
import {
  exchangeGoogleCalendarCode,
  fetchGoogleAccountEmail,
  storeGoogleCalendarTokens,
} from "@/lib/calendar/google-calendar";
import type { TenantScope } from "@/types/communication";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${appUrl}/voice/calendar?gcal=error`);
  }

  try {
    const state = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString("utf8")
    ) as TenantScope & { userId?: string };

    const tokens = await exchangeGoogleCalendarCode(code);
    const email = tokens.accessToken
      ? await fetchGoogleAccountEmail(tokens.accessToken)
      : undefined;
    await storeGoogleCalendarTokens(
      {
        tenantId: state.tenantId,
        workspaceId: state.workspaceId,
        companyId: state.companyId,
      },
      { ...tokens, email },
      state.userId
    );

    return NextResponse.redirect(`${appUrl}/voice/calendar?gcal=connected`);
  } catch (error) {
    console.error("[gcal oauth]", error);
    return NextResponse.redirect(`${appUrl}/voice/calendar?gcal=error`);
  }
}

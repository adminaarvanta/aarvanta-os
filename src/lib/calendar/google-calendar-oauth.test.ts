import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calendarConnectMode,
  googleCalendarOAuthErrorStatus,
  looksLikeCalendarMailbox,
} from "@/lib/calendar/google-calendar";
import { isGoogleCalendarOAuthPublic } from "@/lib/calendar/user-calendar";

describe("googleCalendarOAuthErrorStatus", () => {
  it("maps Google's tester/verification block to denied", () => {
    assert.equal(googleCalendarOAuthErrorStatus("access_denied"), "denied");
  });

  it("maps other OAuth errors to a generic failure", () => {
    assert.equal(googleCalendarOAuthErrorStatus("server_error"), "error");
    assert.equal(googleCalendarOAuthErrorStatus(null), null);
  });
});

describe("isGoogleCalendarOAuthPublic", () => {
  it("stays off unless explicitly enabled", () => {
    const previous = process.env.GOOGLE_CALENDAR_OAUTH_PUBLIC;
    delete process.env.GOOGLE_CALENDAR_OAUTH_PUBLIC;
    assert.equal(isGoogleCalendarOAuthPublic(), false);
    process.env.GOOGLE_CALENDAR_OAUTH_PUBLIC = "true";
    assert.equal(isGoogleCalendarOAuthPublic(), true);
    if (previous === undefined) delete process.env.GOOGLE_CALENDAR_OAUTH_PUBLIC;
    else process.env.GOOGLE_CALENDAR_OAUTH_PUBLIC = previous;
  });
});

describe("looksLikeCalendarMailbox", () => {
  it("accepts a Gmail address and rejects holiday group calendars", () => {
    assert.equal(looksLikeCalendarMailbox("ali.aarvanta@gmail.com"), true);
    assert.equal(
      looksLikeCalendarMailbox("en.usa#holiday@group.v.calendar.google.com"),
      false
    );
  });
});

describe("calendarConnectMode", () => {
  it("treats a connected mailbox as invite, not OAuth", () => {
    assert.equal(
      calendarConnectMode({
        id: "int_1",
        tenantId: "t",
        workspaceId: "w",
        provider: "google_calendar",
        status: "connected",
        accountLabel: "ali.aarvanta@gmail.com",
        metadata: { mode: "invite", email: "ali.aarvanta@gmail.com" },
      }),
      "invite"
    );
    assert.equal(
      calendarConnectMode({
        id: "int_2",
        tenantId: "t",
        workspaceId: "w",
        provider: "google_calendar",
        status: "connected",
        accountLabel: "ali.aarvanta@gmail.com",
        metadata: { refreshToken: "secret", email: "ali.aarvanta@gmail.com" },
      }),
      "oauth"
    );
  });
});

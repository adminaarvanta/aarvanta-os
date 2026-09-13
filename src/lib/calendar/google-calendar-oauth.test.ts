import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { googleCalendarOAuthErrorStatus } from "@/lib/calendar/google-calendar";

describe("googleCalendarOAuthErrorStatus", () => {
  it("maps Google's tester/verification block to denied", () => {
    assert.equal(googleCalendarOAuthErrorStatus("access_denied"), "denied");
  });

  it("maps other OAuth errors to a generic failure", () => {
    assert.equal(googleCalendarOAuthErrorStatus("server_error"), "error");
    assert.equal(googleCalendarOAuthErrorStatus(null), null);
  });
});

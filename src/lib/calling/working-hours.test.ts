import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_WORKING_HOURS,
  type CallCampaign,
} from "@/types/calling-agent";
import { isWithinWorkingHours } from "@/lib/calling/working-hours";

function campaign(timezone: string): CallCampaign {
  return {
    tenantId: "t",
    workspaceId: "w",
    companyId: "c",
    id: "campaign_test",
    name: "Test",
    goal: "Book Meetings",
    status: "running",
    filters: { requirePhone: true },
    voiceAgentId: "agent",
    workingHours: DEFAULT_WORKING_HOURS,
    timezone,
    dailyCallLimit: 40,
    weekendCalling: false,
    retryPolicy: {
      maxRetries: 3,
      busyMinutes: 30,
      noAnswerHours: 24,
      failedMinutes: 15,
      voicemailHours: 24,
    },
    language: "en-US",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  };
}

describe("isWithinWorkingHours", () => {
  // Wednesday 9 Sep 2026. EDT = UTC-4.
  it("treats 07:00 UTC as outside America/New_York weekday hours", () => {
    const at = new Date("2026-09-09T07:00:00.000Z");
    assert.equal(isWithinWorkingHours(campaign("America/New_York"), at), false);
  });

  it("treats 14:00 UTC as inside America/New_York weekday hours", () => {
    const at = new Date("2026-09-09T14:00:00.000Z");
    assert.equal(isWithinWorkingHours(campaign("America/New_York"), at), true);
  });

  it("treats 07:00 UTC as inside Asia/Kolkata weekday hours", () => {
    const at = new Date("2026-09-09T07:00:00.000Z");
    assert.equal(isWithinWorkingHours(campaign("Asia/Kolkata"), at), true);
  });

  it("skips Saturday even inside clock hours", () => {
    const at = new Date("2026-09-12T14:00:00.000Z");
    assert.equal(isWithinWorkingHours(campaign("America/New_York"), at), false);
  });
});

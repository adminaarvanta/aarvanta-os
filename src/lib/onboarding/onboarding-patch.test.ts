import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseOnboardingPatch } from "@/lib/onboarding/onboarding-patch";

describe("onboarding PATCH fields", () => {
  it("accepts the A48 workspace fields", () => {
    const parsed = parseOnboardingPatch({
      name: "Northwind",
      industry: "SaaS & technology",
      customerCountRange: "1-10",
      primaryGoal: "Close inbound leads faster",
      startingWorkflow: "sales_crm",
      timezone: "Europe/London",
      currency: "GBP",
      connectSkipped: true,
      sampleDataOptIn: false,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.startingWorkflow, "sales_crm");
      assert.equal(parsed.data.connectSkipped, true);
    }
  });

  it("rejects a marketing starting workflow", () => {
    const parsed = parseOnboardingPatch({ startingWorkflow: "marketing" });
    assert.equal(parsed.success, false);
  });
});

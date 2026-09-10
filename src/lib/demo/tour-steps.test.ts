import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODULE_TOURS, tourIdForPath } from "@/lib/demo/tour-steps";

describe("module tours", () => {
  it("maps P0 routes to 3–5 step tours", () => {
    assert.equal(tourIdForPath("/dashboard"), "home");
    assert.equal(tourIdForPath("/crm/contacts/1"), "customers");
    assert.equal(tourIdForPath("/inbox"), "inbox");
    assert.equal(tourIdForPath("/automation", "view=ask"), "ai");
    assert.equal(tourIdForPath("/automation"), "automations");
    assert.equal(tourIdForPath("/knowledge"), "knowledge");
    for (const steps of Object.values(MODULE_TOURS)) {
      assert.ok(steps.length >= 3 && steps.length <= 5);
    }
  });
});

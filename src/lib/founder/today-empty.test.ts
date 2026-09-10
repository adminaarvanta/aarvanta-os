import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { todayListsAreEmpty } from "@/lib/founder/today-empty";

describe("Today adapters", () => {
  it("treats empty lists as an honest empty Action Centre", () => {
    assert.equal(
      todayListsAreEmpty({
        attention: [],
        approvals: [],
        recommended: [],
        recentEvents: [],
      }),
      true
    );
  });

  it("is not empty when any live list has an item", () => {
    assert.equal(
      todayListsAreEmpty({
        attention: [{ id: "1" }],
        approvals: [],
        recommended: [],
        recentEvents: [],
      }),
      false
    );
  });
});

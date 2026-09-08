import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertPasswordConfirmation } from "@/lib/account/passwords";
import {
  alternativesForAction,
  canProceedWithoutFriction,
  lossCopyForAction,
  nextStatusForAction,
} from "@/lib/account/lifecycle";

describe("account retention alternatives", () => {
  it("offers pause and downgrade before cancel", () => {
    const ids = alternativesForAction("cancel").map((item) => item.id);
    assert.ok(ids.includes("pause"));
    assert.ok(ids.includes("downgrade"));
    assert.ok(ids.includes("download_data"));
  });

  it("asks users to export data before delete", () => {
    const first = alternativesForAction("delete")[0];
    assert.equal(first.id, "download_data");
    assert.match(lossCopyForAction("delete"), /Download your data first/i);
  });

  it("maps actions to lifecycle statuses", () => {
    assert.equal(nextStatusForAction("pause"), "paused");
    assert.equal(nextStatusForAction("cancel"), "pending_cancel");
    assert.equal(nextStatusForAction("delete"), "deactivated");
    assert.equal(nextStatusForAction("downgrade"), "active");
  });

  it("does not block pause, downgrade, or cancel", () => {
    assert.equal(canProceedWithoutFriction("cancel"), true);
    assert.equal(canProceedWithoutFriction("delete"), false);
  });
});

describe("password confirmation", () => {
  it("requires matching passwords of 8+ characters", () => {
    assert.equal(assertPasswordConfirmation("short", "short"), "Password must be at least 8 characters.");
    assert.equal(
      assertPasswordConfirmation("longenough", "different1"),
      "Passwords do not match."
    );
    assert.equal(assertPasswordConfirmation("longenough", "longenough"), null);
  });
});

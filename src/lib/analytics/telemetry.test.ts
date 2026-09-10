import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listTelemetry,
  recordTelemetry,
  resetTelemetry,
} from "@/lib/analytics/telemetry";

describe("telemetry", () => {
  it("drops sensitive keys and long values", () => {
    resetTelemetry();
    recordTelemetry("signup_complete", {
      password: "hunter2",
      message: "secret body",
      cta: "Start Free",
    });
    const [event] = listTelemetry();
    assert.equal(event?.cta, "Start Free");
    assert.equal(event && "password" in event, false);
    assert.equal(event?.name, "signup_complete");
  });
});

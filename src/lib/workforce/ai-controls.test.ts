import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateAiGate } from "@/lib/workforce/ai-controls";

describe("AI execution gates", () => {
  it("blocks high-impact actions when the workspace is paused", () => {
    const result = evaluateAiGate({
      aiPaused: true,
      control: { status: "active", autonomy: "automatic" },
      highImpact: true,
    });
    assert.equal(result.allowed, false);
    if (!result.allowed) assert.equal(result.code, "workspace_paused");
  });

  it("blocks high-impact actions unless autonomy is automatic", () => {
    const blocked = evaluateAiGate({
      aiPaused: false,
      control: { status: "active", autonomy: "approval_required" },
      highImpact: true,
    });
    assert.equal(blocked.allowed, false);
    const allowed = evaluateAiGate({
      aiPaused: false,
      control: { status: "active", autonomy: "automatic" },
      highImpact: true,
    });
    assert.equal(allowed.allowed, true);
  });

  it("blocks paused agents even for low-impact work", () => {
    const result = evaluateAiGate({
      aiPaused: false,
      control: { status: "paused", autonomy: "automatic" },
      highImpact: false,
    });
    assert.equal(result.allowed, false);
    if (!result.allowed) assert.equal(result.code, "agent_paused");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeCustomerTimeline } from "@/lib/crm/customer-360";
import type { Conversation } from "@/types/communication";
import type { CrmActivity } from "@/types/crm";

describe("customer 360 timeline", () => {
  it("merges activities and conversations without duplicating ids", () => {
    const activities = [
      {
        id: "a1",
        type: "note",
        title: "Called",
        occurredAt: "2026-09-01T10:00:00.000Z",
      },
    ] as CrmActivity[];
    const conversations = [
      {
        id: "c1",
        contact: { id: "p", name: "Ada" },
        channels: ["email"],
        lastActivityAt: "2026-09-02T10:00:00.000Z",
        aiSummary: "Follow up",
      },
    ] as Conversation[];
    const merged = mergeCustomerTimeline({
      activities,
      conversations,
      events: [],
    });
    assert.equal(merged[0]?.source, "conversation");
    assert.equal(merged.length, 2);
    assert.equal(new Set(merged.map((item) => item.id)).size, 2);
  });
});

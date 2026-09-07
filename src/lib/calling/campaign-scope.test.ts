import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  campaignWorkspaceScope,
  campaignWriteScope,
} from "@/lib/calling/campaign-scope";
import { persistScope } from "@/lib/data/crm-helpers";
import type { CallQueueItem } from "@/types/calling-agent";

const item: CallQueueItem = {
  tenantId: "tenant_1",
  workspaceId: "ws_1",
  companyId: "co_1",
  ownerUserId: "user_owner",
  id: "queue_1",
  campaignId: "campaign_1",
  contactId: "contact_1",
  status: "pending",
  attemptCount: 0,
  nextAttemptAt: "2026-09-09T14:00:00.000Z",
  priority: 1,
  createdAt: "2026-09-09T14:00:00.000Z",
  updatedAt: "2026-09-09T14:00:00.000Z",
};

describe("campaignWriteScope", () => {
  it("drops ownerUserId for workspace reads used by cron", () => {
    const scope = campaignWorkspaceScope(item);
    assert.equal(scope.tenantId, "tenant_1");
    assert.equal(scope.ownerUserId, undefined);
  });

  it("keeps the queue owner on sessions created by the dialer", () => {
    const scope = campaignWriteScope(item, { createdBy: "user_other" });
    assert.deepEqual(persistScope(scope), {
      tenantId: "tenant_1",
      workspaceId: "ws_1",
      companyId: "co_1",
      ownerUserId: "user_owner",
    });
  });

  it("falls back to campaign createdBy when the queue item has no owner", () => {
    const orphan = { ...item };
    delete orphan.ownerUserId;
    const scope = campaignWriteScope(orphan, {
      createdBy: "user_creator",
    });
    assert.equal(scope.ownerUserId, "user_creator");
  });
});

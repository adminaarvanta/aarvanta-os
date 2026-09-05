import { closeCallSession } from "@/lib/calling/close-call-session";
import { nextAttemptAtForOutcome } from "@/lib/calling/retry-policy";
import { classifyOpenSession } from "@/lib/calling/stale-call-session";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import type { TenantScope } from "@/types/communication";
import type { CallQueueItem } from "@/types/calling-agent";

export type SweepStaleResult = {
  closed: number;
  repaired: number;
  closedSessionIds: string[];
};

function scopeOf(record: TenantScope): TenantScope {
  return {
    tenantId: record.tenantId,
    workspaceId: record.workspaceId,
    companyId: record.companyId,
  };
}

export async function sweepStaleSessions(opts?: {
  scope?: TenantScope;
  limit?: number;
  now?: number;
}): Promise<SweepStaleResult> {
  const repo = getCallingAgentRepository();
  const now = opts?.now ?? Date.now();
  const limit = opts?.limit ?? 100;

  const open = opts?.scope
    ? [
        ...(await repo.listSessions(opts.scope, { status: "ringing" })),
        ...(await repo.listSessions(opts.scope, { status: "in_progress" })),
      ]
    : await repo.listOpenSessions(limit);

  const closedSessionIds: string[] = [];

  for (const session of open) {
    const verdict = classifyOpenSession(session, now);
    if (!verdict.stale) continue;
    const closed = await closeCallSession({
      scope: scopeOf(session),
      session,
      outcome: verdict.outcome,
      summary: verdict.summary,
      hangup: true,
    });
    if (closed && (closed.status === "completed" || closed.status === "failed")) {
      closedSessionIds.push(closed.id);
    }
  }

  const callingItems = opts?.scope
    ? await repo.listQueue(opts.scope, { status: "calling" })
    : await repo.listQueueItemsByStatus("calling", limit);

  let repaired = 0;
  for (const item of callingItems) {
    if (await repairOrphanQueueItem(item)) repaired += 1;
  }

  return {
    closed: closedSessionIds.length,
    repaired,
    closedSessionIds,
  };
}

async function repairOrphanQueueItem(item: CallQueueItem): Promise<boolean> {
  const repo = getCallingAgentRepository();
  const scope = scopeOf(item);

  if (item.sessionId) {
    const session = await repo.getSession(item.sessionId, scope);
    if (session && (session.status === "ringing" || session.status === "in_progress")) {
      return false;
    }
    if (session && (session.status === "completed" || session.status === "failed")) {
      return releaseQueueItem(item, session.outcome ?? "failed");
    }
  }

  return releaseQueueItem(item, item.lastOutcome ?? "failed");
}

async function releaseQueueItem(
  item: CallQueueItem,
  outcome: NonNullable<CallQueueItem["lastOutcome"]>
): Promise<boolean> {
  const repo = getCallingAgentRepository();
  const scope = scopeOf(item);
  const campaign = await repo.getCampaign(item.campaignId, scope);
  if (campaign) {
    const next = nextAttemptAtForOutcome(
      outcome,
      campaign.retryPolicy,
      item.attemptCount
    );
    await repo.updateQueueItem(
      item.id,
      {
        status: next.retry ? "pending" : next.status,
        nextAttemptAt: next.nextAttemptAt,
        lastOutcome: outcome,
      },
      scope
    );
  } else {
    await repo.updateQueueItem(
      item.id,
      { status: "failed", lastOutcome: outcome },
      scope
    );
  }
  return true;
}

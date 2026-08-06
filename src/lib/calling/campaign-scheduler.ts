import { isWithinWorkingHours, countCallsToday } from "@/lib/calling/working-hours";
import { deliverOutbound } from "@/lib/channels/deliver";
import { buildCallMemorySummary } from "@/lib/calling/call-memory";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { crmNow } from "@/lib/data/crm-helpers";
import { contactDisplayName } from "@/types/crm";
import type { CallQueueItem } from "@/types/calling-agent";

export type SchedulerResult = {
  id: string;
  ok: boolean;
  error?: string;
  skipped?: string;
};

export async function runCampaignScheduler(limit = 10): Promise<SchedulerResult[]> {
  const repo = getCallingAgentRepository();
  const now = crmNow();
  const due = await repo.listDueQueueItems(now, limit * 2);
  const results: SchedulerResult[] = [];
  const dialedByCampaign = new Map<string, number>();

  for (const item of due) {
    if (results.filter((r) => r.ok).length >= limit) break;

    const scope = {
      tenantId: item.tenantId,
      workspaceId: item.workspaceId,
      companyId: item.companyId,
    };

    const campaign = await repo.getCampaign(item.campaignId, scope);
    if (!campaign || campaign.status !== "running") {
      results.push({ id: item.id, ok: false, skipped: "campaign_not_running" });
      continue;
    }

    if (!isWithinWorkingHours(campaign)) {
      results.push({ id: item.id, ok: false, skipped: "outside_working_hours" });
      continue;
    }

    const queue = await repo.listQueue(scope, { campaignId: campaign.id });
    const todayAttempts = queue
      .map((q) => q.lastAttemptAt)
      .filter((v): v is string => Boolean(v));
    const already =
      countCallsToday(todayAttempts, campaign.timezone) +
      (dialedByCampaign.get(campaign.id) ?? 0);
    if (already >= campaign.dailyCallLimit) {
      results.push({ id: item.id, ok: false, skipped: "daily_limit" });
      continue;
    }

    try {
      await dialQueueItem(item);
      dialedByCampaign.set(
        campaign.id,
        (dialedByCampaign.get(campaign.id) ?? 0) + 1
      );
      results.push({ id: item.id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      await repo.updateQueueItem(
        item.id,
        {
          status: "failed",
          lastOutcome: "failed",
          attemptCount: item.attemptCount + 1,
          lastAttemptAt: crmNow(),
        },
        scope
      );
      results.push({ id: item.id, ok: false, error: message });
    }
  }

  return results;
}

/** Manual dial — skips working-hours / daily-limit checks. */
export async function dialQueueItemNow(
  queueId: string,
  scope: { tenantId: string; workspaceId: string; companyId: string }
): Promise<{ sessionId: string }> {
  const repo = getCallingAgentRepository();
  const item = await repo.getQueueItem(queueId, scope);
  if (!item) throw new Error("Queue item not found");
  if (item.status === "calling") {
    throw new Error("Call already in progress for this lead");
  }

  const campaign = await repo.getCampaign(item.campaignId, scope);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "cancelled" || campaign.status === "completed") {
    throw new Error(`Cannot dial for a ${campaign.status} campaign`);
  }

  await dialQueueItem(item);
  const updated = await repo.getQueueItem(queueId, scope);
  if (!updated?.sessionId) throw new Error("Call started but session missing");
  return { sessionId: updated.sessionId };
}

export async function dialQueueItem(item: CallQueueItem) {
  const scope = {
    tenantId: item.tenantId,
    workspaceId: item.workspaceId,
    companyId: item.companyId,
  };
  const repo = getCallingAgentRepository();
  const campaign = await repo.getCampaign(item.campaignId, scope);
  if (!campaign) throw new Error("Campaign missing");

  const contact = await getCrmRepository().getContact(item.contactId, scope);
  if (!contact?.phone) throw new Error("Contact has no phone");

  const agent = await repo.getAgent(campaign.voiceAgentId, scope);
  const memorySummary = await buildCallMemorySummary(item.contactId, scope);

  const inbox = getRepository();
  let conversation = await inbox.findConversationByPhone(contact.phone, scope);
  if (!conversation) {
    conversation = await inbox.addInboundCall(
      {
        phone: contact.phone,
        contactName: contactDisplayName(contact),
        durationSeconds: 0,
        summary: `Campaign: ${campaign.name}`,
      },
      scope
    );
  }

  const session = await repo.createSession(
    {
      queueId: item.id,
      campaignId: campaign.id,
      contactId: contact.id,
      voiceAgentId: campaign.voiceAgentId,
      conversationId: conversation.id,
      status: "ringing",
      memorySummary,
    },
    scope
  );

  await repo.updateQueueItem(
    item.id,
    {
      status: "calling",
      attemptCount: item.attemptCount + 1,
      lastAttemptAt: crmNow(),
      sessionId: session.id,
    },
    scope
  );

  const briefing = [
    `You are ${agent?.greetingName ?? agent?.name ?? "Ava"} calling from Aarvanta.`,
    `Campaign goal: ${campaign.goal}.`,
    `Contact: ${contactDisplayName(contact)}${contact.jobTitle ? `, ${contact.jobTitle}` : ""}.`,
    memorySummary ? `Prior context: ${memorySummary}` : "",
    "Follow the conversation stages: greeting → permission → qualification → meeting proposal.",
  ]
    .filter(Boolean)
    .join(" ");

  await deliverOutbound({
    channel: "voice",
    contact: {
      ...conversation.contact,
      phone: contact.phone,
      name: contactDisplayName(contact),
    },
    content: briefing,
    conversationId: conversation.id,
    voiceDirection: "outbound",
    campaignId: campaign.id,
    queueId: item.id,
    sessionId: session.id,
    contactId: contact.id,
    voiceAgentId: agent?.id,
  });

  await inbox.addOutboundCall(
    conversation.id,
    { summary: `[Campaign ${campaign.name}] Outbound AI call` },
    scope,
    { name: agent?.name ?? "Voice Agent", id: agent?.id ?? "voice-agent" }
  );

  await repo.updateSession(session.id, { status: "in_progress" }, scope);
}

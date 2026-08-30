import type { EmailCampaign, EmailSendItem } from "@/types/email-outreach";

export function buildEmailOutreachMetrics(
  campaigns: EmailCampaign[],
  queue: EmailSendItem[]
) {
  const sent = queue.filter((i) =>
    ["sent", "delivered", "opened", "clicked"].includes(i.status)
  ).length;
  const delivered = queue.filter((i) =>
    ["delivered", "opened", "clicked"].includes(i.status)
  ).length;
  const opened = queue.filter((i) =>
    ["opened", "clicked"].includes(i.status)
  ).length;
  const clicked = queue.filter((i) => i.status === "clicked").length;
  const bounced = queue.filter((i) =>
    ["bounced", "blocked", "spam"].includes(i.status)
  ).length;
  const failed = queue.filter((i) => i.status === "failed").length;
  const pending = queue.filter((i) => i.status === "pending").length;

  return {
    campaigns: campaigns.length,
    running: campaigns.filter((c) => c.status === "running").length,
    queued: pending,
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    failed,
    openRate: sent ? Math.round((opened / sent) * 100) : 0,
    clickRate: sent ? Math.round((clicked / sent) * 100) : 0,
  };
}

export function campaignQueueStats(queue: EmailSendItem[]) {
  const counts: Record<string, number> = {};
  for (const item of queue) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts;
}

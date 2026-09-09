import { buildFounderSnapshot } from "@/lib/founder/build-snapshot";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getEventRepository } from "@/lib/data/event-store";
import { getRepository } from "@/lib/data/repository";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { listPendingApprovals } from "@/lib/workforce/pipeline/approvals";
import { contactDisplayName } from "@/types/crm";
import type { TenantScope } from "@/types/communication";
import type { TodaySnapshot } from "@/types/founder";

function hrefForEvent(type: string, entityId: string): string {
  if (type.startsWith("contact.")) return `/crm/contacts/${entityId}`;
  if (type.startsWith("deal.")) return `/crm/deals/${entityId}`;
  if (type.startsWith("conversation.")) return `/inbox/${entityId}`;
  if (type.startsWith("workflow.")) return `/workflows/runs/${entityId}`;
  if (type.startsWith("workforce.")) return `/workforce/jobs/${entityId}`;
  if (type.startsWith("invoice.")) return "/finance/invoices";
  return "/dashboard";
}

export async function buildTodaySnapshot(
  scope: TenantScope
): Promise<TodaySnapshot> {
  const [base, contacts, deals, crmTasks, conversations, workflowRuns, pending, events] =
    await Promise.all([
      buildFounderSnapshot(scope),
      getCrmRepository().listContacts(scope),
      getCrmRepository().listDeals(scope),
      getCrmRepository().listTasks(scope),
      getRepository().listConversations(scope),
      getWorkflowRepository().listRuns(scope),
      listPendingApprovals(scope),
      getEventRepository().list(scope, { limit: 12 }),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const staleMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const stalledDeals = deals.filter((deal) => {
    if (deal.status !== "open") return false;
    const updated = new Date(deal.updatedAt).getTime();
    return Number.isFinite(updated) && now - updated > staleMs;
  });

  const overdueCrm = crmTasks.filter(
    (task) => task.status !== "done" && task.dueDate && task.dueDate < today
  );
  const urgentInbox = conversations.filter(
    (c) =>
      c.unreadCount > 0 ||
      c.sentiment === "urgent" ||
      c.sentiment === "frustrated"
  );
  const failedRuns = workflowRuns.filter((run) => run.status === "failed");

  const attention = [
    ...stalledDeals.slice(0, 3).map((deal) => ({
      id: `deal-${deal.id}`,
      title: deal.title,
      reason: "Open deal with no movement in 14 days.",
      href: `/crm/deals/${deal.id}`,
      actionLabel: "Review deal",
    })),
    ...overdueCrm.slice(0, 3).map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      reason: "Overdue task.",
      href: "/crm/tasks",
      actionLabel: "Open tasks",
    })),
    ...urgentInbox.slice(0, 3).map((conversation) => ({
      id: `inbox-${conversation.id}`,
      title: conversation.contact.name,
      reason:
        conversation.sentiment === "urgent" || conversation.sentiment === "frustrated"
          ? `Inbox ${conversation.sentiment} — needs a human reply.`
          : `${conversation.unreadCount} unread message(s).`,
      href: `/inbox/${conversation.id}`,
      actionLabel: "Open conversation",
    })),
    ...failedRuns.slice(0, 2).map((run) => ({
      id: `wf-${run.id}`,
      title: "Automation failed",
      reason: "A workflow run failed and needs a retry.",
      href: `/workflows/runs/${run.id}`,
      actionLabel: "Inspect run",
    })),
  ];

  const workflowApprovals = workflowRuns
    .filter((run) => run.status === "awaiting_approval")
    .map((run) => ({
      id: `wfa-${run.id}`,
      title: "Workflow approval",
      reason: "A workflow is paused until you approve the next step.",
      href: `/workflows/runs/${run.id}`,
      consequence: "Approving continues the run. Rejecting stops it.",
    }));

  const agentApprovals = pending.map((approval) => ({
    id: approval.id,
    title: approval.proposedAction,
    reason: approval.reason,
    href: "/workforce/waiting",
    consequence:
      "Approving performs the proposed action. Rejecting leaves records unchanged.",
  }));

  const recommended = [
    ...contacts
      .filter((c) => (c.leadScore ?? 0) >= 70)
      .slice(0, 2)
      .map((contact) => ({
        id: `rec-lead-${contact.id}`,
        title: `Follow up ${contactDisplayName(contact)}`,
        reason: "Lead score is hot and waiting on outreach.",
        expectedOutcome: "Move a qualified lead into a conversation or deal.",
        href: `/crm/contacts/${contact.id}`,
      })),
    ...base.focus.slice(0, 3).map((item, index) => ({
      id: `focus-${index}`,
      title: item,
      reason: "Ranked from today's live records.",
      expectedOutcome: "Clear the highest-risk item first.",
      href: attention[0]?.href ?? "/crm",
    })),
  ].slice(0, 5);

  const recentEvents = events.map((event) => ({
    id: event.id,
    title: `${event.type.replace(/\./g, " ")} · ${event.entityType}`,
    href: hrefForEvent(event.type, event.entityId),
    time: new Date(event.timestamp).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
  }));

  return {
    ...base,
    attention,
    approvals: [...agentApprovals, ...workflowApprovals],
    recommended,
    recentEvents,
  };
}

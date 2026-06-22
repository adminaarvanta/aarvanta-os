import { crmNow } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getFinanceStore, getPortalStore } from "@/lib/data/platform-store";
import { getProjectRepository } from "@/lib/data/project-store";
import { getNotificationsRepository } from "@/lib/data/notifications-store";
import { executeAgentRun } from "@/lib/workforce/run-agent";
import { buildWorkforceContext } from "@/lib/workforce/context";
import { contactDisplayName } from "@/types/crm";
import type { TenantScope } from "@/types/communication";
import type { CrmContact, CrmDeal } from "@/types/crm";

export type DealWonResult = {
  invoiceId: string;
  portalId: string;
  projectId: string;
};

/** When a deal is won — invoice, portal access, onboarding project, COO monitoring. */
export async function runDealWonAutomation(
  scope: TenantScope,
  deal: CrmDeal
): Promise<DealWonResult> {
  const crm = getCrmRepository();
  const finance = getFinanceStore();
  const portal = getPortalStore();
  const projects = getProjectRepository();
  const notifications = getNotificationsRepository();

  let contact: CrmContact | null = null;
  if (deal.contactId) {
    contact = await crm.getContact(deal.contactId, scope);
  }

  const clientName = contact
    ? contactDisplayName(contact)
    : deal.title.replace(/\s*—.*$/, "").trim() || "New Client";

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const invoice = await finance.create({
    ...scope,
    number: invoiceNumber,
    clientName,
    amount: deal.value,
    currency: deal.currency ?? "GBP",
    status: "sent",
    dueDate: dueDate.toISOString().slice(0, 10),
    createdAt: crmNow(),
  });

  const portalAccess = await portal.create({
    ...scope,
    clientName,
    email: contact?.email ?? `client+${deal.id}@demo.aarvanta.co`,
    enabled: true,
    projectIds: [],
    lastLoginAt: undefined,
  });

  await crm.createActivity(
    {
      type: "note",
      title: "Customer onboarded — portal access granted",
      description: `${clientName} can view invoices, project progress, and deliverables in the client portal.`,
      contactId: deal.contactId,
      dealId: deal.id,
      authorName: "Aarvanta OS",
    },
    scope
  );

  const project = await projects.createProject(
    {
      name: `${clientName} — Onboarding`,
      description: `Post-sale delivery for ${deal.title}. AI COO monitors milestones and escalations.`,
      status: "active",
      contactId: deal.contactId,
      dealId: deal.id,
      tags: ["onboarding", "demo"],
      dueDate: dueDate.toISOString().slice(0, 10),
    },
    scope
  );

  await portal.set({
    ...portalAccess,
    projectIds: [project.id],
  });

  await projects.createTask(
    {
      projectId: project.id,
      title: "Kickoff call scheduled",
      description: "Confirm scope, timeline, and success criteria with the client.",
      status: "todo",
      priority: "high",
    },
    scope
  );

  await projects.createTask(
    {
      projectId: project.id,
      title: "Provision workspace & integrations",
      description: "Set up tenant workspace, channels, and AI workforce agents.",
      status: "todo",
      priority: "medium",
    },
    scope
  );

  const workforceContext = await buildWorkforceContext(scope, {
    contactId: deal.contactId,
  });

  const cooRun = await executeAgentRun({
    agentType: "coo",
    context: workforceContext,
  });

  await notifications.createNotification(
    {
      kind: "notification",
      priority: "medium",
      title: `AI COO monitoring: ${project.name}`,
      body: cooRun.summary,
      actionUrl: `/projects/${project.id}`,
      source: "ai_coo",
    },
    scope
  );

  return {
    invoiceId: invoice.id,
    portalId: portalAccess.id,
    projectId: project.id,
  };
}

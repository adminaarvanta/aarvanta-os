import { refreshConversationAiInsights } from "@/lib/ai/refresh-conversation-insights";
import { crmNow } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { ensureSalesPipeline } from "@/lib/demo/crm-bootstrap";
import { runDealWonAutomation } from "@/lib/demo/deal-won-automation";
import { runPostQualificationAutomation } from "@/lib/demo/post-qualification";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { executeAgentRun } from "@/lib/workforce/run-agent";
import { buildWorkforceContext } from "@/lib/workforce/context";
import { saveRunToAgentMemory } from "@/lib/workforce/save-run-memory";
import { contactDisplayName } from "@/types/crm";
import type { TenantScope } from "@/types/communication";
import type { AgentType } from "@/types/workforce";

export type DemoJourneyStep = {
  id: string;
  label: string;
  status: "completed" | "skipped" | "failed";
  summary: string;
  href?: string;
};

export type DemoJourneyResult = {
  ok: boolean;
  steps: DemoJourneyStep[];
  links: {
    inbox?: string;
    contact?: string;
    deal?: string;
    invoice?: string;
    portal?: string;
    project?: string;
    communications?: string;
    workforce?: string;
  };
};

const DEMO_LEAD = {
  name: "Alex Rivera",
  email: "alex.rivera@northwinddigital.co.uk",
  phone: "+447700900888",
  message:
    "Hi — we're interested in your Growth plan pricing and would like to book a demo call this week. Budget is approved for £12k annually.",
};

async function runPersistedAgent(
  scope: TenantScope,
  agentType: AgentType,
  contactId?: string,
  conversationId?: string
) {
  const repo = getWorkforceRepository();
  const run = await repo.createRun(
    {
      agentType,
      status: "running",
      trigger: "manual",
      contactId,
      conversationId,
      summary: "",
      recommendations: [],
      actions: [],
    },
    scope
  );

  const context = await buildWorkforceContext(scope, { contactId, conversationId });
  const result = await executeAgentRun({ agentType, context });

  const completed = await repo.updateRun(
    run.id,
    {
      status: "completed",
      summary: result.summary,
      recommendations: result.recommendations,
      actions: result.actions,
      inputSummary: context.contact?.name ?? "Inbound lead",
      completedAt: crmNow(),
    },
    scope
  );

  if (completed) await saveRunToAgentMemory(completed, scope);
  return completed ?? run;
}

/**
 * Runs the full 90-second demo journey from the product spec:
 * Lead → Sales qualify → Marketing nurture → Human notify → Deal won →
 * Invoice → Onboard → Project → COO monitor.
 */
export async function runNinetySecondJourney(
  scope: TenantScope
): Promise<DemoJourneyResult> {
  const steps: DemoJourneyStep[] = [];
  const links: DemoJourneyResult["links"] = {
    communications: "/communications",
    workforce: "/workforce",
  };

  const repo = getRepository();
  const crm = getCrmRepository();

  try {
    const conversation = await repo.addInboundMessage(
      {
        phone: DEMO_LEAD.phone,
        contactName: DEMO_LEAD.name,
        channel: "whatsapp",
        content: DEMO_LEAD.message,
      },
      scope
    );

    steps.push({
      id: "lead_enters",
      label: "Lead enters",
      status: "completed",
      summary: `${DEMO_LEAD.name} sent a WhatsApp inquiry about the Growth plan.`,
      href: `/whatsapp/${conversation.id}`,
    });
    links.inbox = `/whatsapp/${conversation.id}`;

    await refreshConversationAiInsights(conversation.id, scope);

    let contact =
      (await crm.listContacts(scope)).find((c) =>
        c.conversationIds.includes(conversation.id)
      ) ?? null;

    if (!contact) {
      const refreshed = await repo.getConversation(conversation.id, scope);
      const score = refreshed?.aiQualificationScore ?? 0;
      contact = await crm.createContact(
        {
          firstName: "Alex",
          lastName: "Rivera",
          email: DEMO_LEAD.email,
          phone: DEMO_LEAD.phone,
          tags: ["prospect", "hot_lead"],
          conversationIds: [conversation.id],
          notes: refreshed?.aiSummary,
        },
        scope
      );
      await crm.updateContact(
        contact.id,
        {
          leadScore: Math.max(score, 78),
          leadScoreReason: "Demo journey — high purchase intent inbound.",
          leadScoreUpdatedAt: crmNow(),
        },
        scope
      );
    }

    const salesRun = await runPersistedAgent(
      scope,
      "sales_manager",
      contact.id,
      conversation.id
    );

    steps.push({
      id: "sales_qualifies",
      label: "AI Sales Manager qualifies",
      status: "completed",
      summary: salesRun.summary,
      href: `/workforce/sales_manager`,
    });
    links.contact = `/crm/contacts/${contact.id}`;

    const nurture = await runPostQualificationAutomation(scope, contact, {
      conversationId: conversation.id,
    });

    steps.push({
      id: "marketing_nurtures",
      label: "AI Marketing Manager nurtures",
      status: "completed",
      summary: nurture.marketingSummary,
      href: "/workforce/marketing_manager",
    });

    steps.push({
      id: "human_notified",
      label: "Human closer receives notification",
      status: "completed",
      summary: `Alert sent to closer: ${contactDisplayName(contact)} is ready for a closing call.`,
      href: "/communications",
    });

    const pipeline = await ensureSalesPipeline(scope);
    const wonStage =
      pipeline.stages.find((s) => s.name.toLowerCase() === "won") ??
      pipeline.stages.at(-1)!;

    const deal = await crm.createDeal(
      {
        title: `${contactDisplayName(contact)} — Growth Plan`,
        pipelineId: pipeline.id,
        stageId: wonStage.id,
        contactId: contact.id,
        value: 12000,
        currency: "GBP",
        probability: 100,
        status: "won",
        notes: "Closed during live demo — verbal confirmation on kickoff call.",
      },
      scope
    );

    steps.push({
      id: "deal_closed",
      label: "Deal closes",
      status: "completed",
      summary: `Deal won: £${deal.value.toLocaleString("en-GB")} — ${deal.title}`,
      href: `/crm/deals/${deal.id}`,
    });
    links.deal = `/crm/deals/${deal.id}`;

    const won = await runDealWonAutomation(scope, deal);

    steps.push({
      id: "invoice_generated",
      label: "Invoice generated",
      status: "completed",
      summary: `Invoice ${won.invoiceId} sent to ${contactDisplayName(contact)}.`,
      href: "/finance",
    });
    links.invoice = "/finance";

    steps.push({
      id: "customer_onboarded",
      label: "Customer onboarded",
      status: "completed",
      summary: `Portal access enabled for ${contact.email ?? contactDisplayName(contact)}.`,
      href: "/portal",
    });
    links.portal = "/portal";

    steps.push({
      id: "project_assigned",
      label: "Project assigned",
      status: "completed",
      summary: `Onboarding project created with kickoff and provisioning tasks.`,
      href: `/projects/${won.projectId}`,
    });
    links.project = `/projects/${won.projectId}`;

    const cooRun = await runPersistedAgent(scope, "coo", contact.id);

    steps.push({
      id: "coo_monitors",
      label: "AI COO monitors delivery",
      status: "completed",
      summary: cooRun.summary,
      href: "/workforce/coo",
    });

    return { ok: true, steps, links };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo journey failed";
    steps.push({
      id: "error",
      label: "Journey interrupted",
      status: "failed",
      summary: message,
    });
    return { ok: false, steps, links };
  }
}

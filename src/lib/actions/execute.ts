import { crmNow } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getFinanceStore } from "@/lib/data/platform-store";
import { publishDomainEvent } from "@/lib/events/publish";
import { buildFounderSnapshot } from "@/lib/founder/build-snapshot";
import { actorFromSession, aiAgentActor } from "@/lib/identity/from-session";
import { routeFabricTask } from "@/lib/fabric/orchestrate";
import { postInvoiceToLedger } from "@/lib/finance/ledger";
import { createAndInterpretLaunch } from "@/lib/launch/orchestrate";
import { getLaunchRepository } from "@/lib/data/launch-store";
import {
  handleAnalyzeContract,
  handleGenerateContract,
  handleGenerateHrDocument,
  handleGeneratePayslip,
  handleGeneratePl,
  handleGetIndustryKpis,
  handleHireEmployee,
  handlePostJournalEntry,
  handleReconcileAccount,
  handleRunPayroll,
  handleStartWorkflow,
} from "@/lib/actions/m2-handlers";
import { validateAgainstRules } from "@/lib/rules/validate-mutation";
import type { SessionContext } from "@/lib/tenant/context";
import type {
  BusinessActionRequest,
  BusinessActionResponse,
} from "@/lib/actions/intents";
import type { AgentType } from "@/types/workforce";

export async function executeBusinessAction(
  ctx: SessionContext,
  request: BusinessActionRequest
): Promise<BusinessActionResponse> {
  const { intent, context = {}, metadata } = request;
  const scope = ctx.scope;
  const actor = actorFromSession(ctx);

  const ruleCheck = validateAgainstRules(
    { intent, ...context },
    {
      country: typeof context.country === "string" ? context.country : undefined,
    }
  );

  if (!ruleCheck.allowed) {
    return {
      status: "error",
      error: { code: "RULE_BLOCKED", message: ruleCheck.message },
    };
  }

  try {
    switch (intent) {
      case "create_contact": {
        const firstName =
          typeof context.firstName === "string" ? context.firstName : "New";
        const lastName =
          typeof context.lastName === "string" ? context.lastName : "Contact";
        const contact = await getCrmRepository().createContact(
          {
            firstName,
            lastName,
            email: typeof context.email === "string" ? context.email : undefined,
            phone: typeof context.phone === "string" ? context.phone : undefined,
            tags: ["prospect"],
          },
          scope
        );
        const event = await publishDomainEvent({
          scope,
          type: "contact.created",
          actor,
          entityType: "contact",
          entityId: contact.id,
          payload: { source: metadata?.source ?? "api", intent },
          source: "api",
        });
        return {
          status: "success",
          eventId: event.id,
          auditId: event.id,
          result: { contactId: contact.id, href: `/crm/contacts/${contact.id}` },
        };
      }

      case "create_task": {
        const title =
          typeof context.title === "string" ? context.title : "Follow up";
        const task = await getCrmRepository().createTask(
          {
            title,
            status: "todo",
            priority:
              context.priority === "high" || context.priority === "low"
                ? context.priority
                : "medium",
            source: "manual",
            contactId:
              typeof context.contactId === "string" ? context.contactId : undefined,
          },
          scope
        );
        const event = await publishDomainEvent({
          scope,
          type: "task.created",
          actor,
          entityType: "task",
          entityId: task.id,
          payload: { intent },
          source: "api",
        });
        return {
          status: "success",
          eventId: event.id,
          auditId: event.id,
          result: { taskId: task.id },
        };
      }

      case "create_invoice": {
        const clientName =
          typeof context.clientName === "string" ? context.clientName : "Client";
        const amount =
          typeof context.amount === "number" ? context.amount : 1000;
        const invoice = await getFinanceStore().create({
          ...scope,
          number: `INV-${Date.now().toString().slice(-6)}`,
          clientName,
          amount,
          currency: typeof context.currency === "string" ? context.currency : "GBP",
          status: "draft",
          dueDate: crmNow().slice(0, 10),
          createdAt: crmNow(),
        });

        let journalEntryId: string | undefined;
        try {
          const journal = await postInvoiceToLedger(scope, invoice);
          journalEntryId = journal.id;
        } catch {
          // CoA may not be provisioned yet
        }

        const event = await publishDomainEvent({
          scope,
          type: "invoice.created",
          actor,
          entityType: "invoice",
          entityId: invoice.id,
          payload: { amount, clientName },
          source: "api",
        });
        return {
          status: "success",
          eventId: event.id,
          auditId: event.id,
          result: {
            invoiceId: invoice.id,
            journalEntryId,
            href: "/finance",
          },
        };
      }

      case "post_journal_entry":
        return handlePostJournalEntry(ctx, context);

      case "generate_pl":
        return handleGeneratePl(ctx, context);

      case "reconcile_account":
        return handleReconcileAccount(ctx, context);

      case "run_payroll":
        return handleRunPayroll(ctx, context);

      case "generate_payslip":
        return handleGeneratePayslip(ctx, context);

      case "analyze_contract":
        return handleAnalyzeContract(ctx, context);

      case "generate_contract":
        return handleGenerateContract(ctx, context);

      case "generate_hr_document":
        return handleGenerateHrDocument(ctx, context);

      case "hire_employee":
        return handleHireEmployee(ctx, context);

      case "start_workflow":
        return handleStartWorkflow(ctx, context);

      case "get_industry_kpis":
        return handleGetIndustryKpis(ctx, context);

      case "run_ai_buddy": {
        const buddyId =
          typeof context.buddyId === "string" ? context.buddyId : "sales_buddy";
        const task =
          typeof context.task === "string" ? context.task : "Review current priorities";
        const fabric = await routeFabricTask({
          scope,
          buddyId,
          task,
          actor: aiAgentActor(buddyId),
        });
        const event = await publishDomainEvent({
          scope,
          type: "ai.decision.executed",
          actor: aiAgentActor(buddyId),
          entityType: "ai_agent",
          entityId: buddyId,
          payload: { task, fabric },
          source: "ai",
        });
        return {
          status: "success",
          eventId: event.id,
          auditId: event.id,
          aiDecision: {
            reasoning: fabric.reasoning,
            confidenceScore: fabric.confidence,
            riskLevel: fabric.riskLevel,
          },
          result: fabric,
        };
      }

      case "get_business_snapshot": {
        const snapshot = await buildFounderSnapshot(scope);
        return {
          status: "success",
          result: snapshot as unknown as Record<string, unknown>,
          aiDecision: {
            reasoning: "Founder snapshot aggregated from CRM, projects, and workforce.",
            confidenceScore: 1,
            riskLevel: "low",
          },
        };
      }

      case "launch_business": {
        const businessIdea =
          typeof context.businessIdea === "string"
            ? context.businessIdea
            : "New online business";
        const { session, usedAi } = await createAndInterpretLaunch(
          {
            businessIdea,
            countryBase:
              typeof context.countryBase === "string" ? context.countryBase : "UK",
            scale:
              context.scale === "solo" ||
              context.scale === "startup" ||
              context.scale === "smb" ||
              context.scale === "enterprise"
                ? context.scale
                : "startup",
            channels: Array.isArray(context.channels)
              ? (context.channels as ("online" | "retail")[])
              : ["online"],
            targetMarket:
              typeof context.targetMarket === "string"
                ? context.targetMarket
                : "global",
          },
          scope
        );
        await getLaunchRepository().save(session);
        const event = await publishDomainEvent({
          scope,
          type: "launch.interpreted",
          actor,
          entityType: "launch_session",
          entityId: session.id,
          payload: { brandName: session.brandName, usedAi },
          source: "api",
        });
        return {
          status: "success",
          eventId: event.id,
          auditId: event.id,
          aiDecision: {
            reasoning: session.businessModel?.aiInsight,
            confidenceScore: session.industry?.confidence,
            riskLevel: "low",
          },
          result: {
            sessionId: session.id,
            href: `/launch?session=${session.id}`,
            brandName: session.brandName,
          },
        };
      }

      default:
        return {
          status: "error",
          error: { code: "UNKNOWN_INTENT", message: `Unknown intent: ${intent}` },
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return {
      status: "error",
      error: { code: "EXECUTION_FAILED", message },
    };
  }
}

/** Map buddy id to workforce agent type for future deep integration. */
export function buddyToAgentType(buddyId: string): AgentType | null {
  const map: Record<string, AgentType> = {
    accounting_buddy: "cfo",
    sales_buddy: "sales_manager",
    marketing_buddy: "marketing_manager",
    hr_buddy: "hr_manager",
    legal_buddy: "hr_manager",
    operations_buddy: "coo",
    customer_success_buddy: "customer_success_manager",
    ceo_buddy: "ceo",
  };
  return map[buddyId] ?? null;
}

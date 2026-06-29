import { getCrmRepository } from "@/lib/data/crm-store";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { publishDomainEvent } from "@/lib/events/publish";
import { scheduleProcessHrCase } from "@/lib/hr/process-case";
import type { TenantScope } from "@/types/communication";
import type { AgentAction } from "@/types/workforce";
import type { HrDocumentType } from "@/types/platform-modules";

const HR_DOC_TYPES = new Set<string>([
  "offer_letter",
  "experience_letter",
  "appointment_letter",
  "relieving_letter",
  "salary_certificate",
  "employment_verification",
  "corporate_invoice",
  "nda",
  "policy_memo",
  "warning_letter",
  "custom_corporate",
]);

export async function applyAgentAction(
  action: AgentAction,
  scope: TenantScope,
  options?: { agentType?: string; runId?: string }
): Promise<{ kind: string; id?: string; message: string }> {
  const crm = getCrmRepository();

  switch (action.type) {
    case "create_task": {
      const p = action.payload as {
        title?: string;
        description?: string;
        priority?: "low" | "medium" | "high";
        dueDate?: string;
        contactId?: string;
        accountId?: string;
        dealId?: string;
      };
      if (!p.title) throw new Error("Task title is required.");
      const task = await crm.createTask(
        {
          title: p.title,
          description: p.description,
          priority: p.priority ?? "medium",
          dueDate: p.dueDate,
          contactId: p.contactId,
          accountId: p.accountId,
          dealId: p.dealId,
          assignedAgentType: options?.agentType,
          agentRunId: options?.runId,
          source: "ai",
        },
        scope
      );
      return { kind: "task", id: task.id, message: `Task created: ${task.title}` };
    }
    case "create_activity": {
      const p = action.payload as {
        type?: "call" | "meeting" | "note";
        title?: string;
        description?: string;
        contactId?: string;
        accountId?: string;
        dealId?: string;
      };
      if (!p.title || !p.type) throw new Error("Activity type and title are required.");
      const activity = await crm.createActivity(
        {
          type: p.type,
          title: p.title,
          description: p.description,
          contactId: p.contactId,
          accountId: p.accountId,
          dealId: p.dealId,
          authorName: "AI Workforce",
        },
        scope
      );
      return {
        kind: "activity",
        id: activity.id,
        message: `Activity logged: ${activity.title}`,
      };
    }
    case "suggest_reply":
      return {
        kind: "suggest_reply",
        message:
          (action.payload.content as string) ||
          "Draft reply available — copy from run details.",
      };
    case "alert":
      return {
        kind: "alert",
        message: (action.payload.message as string) || action.label,
      };
    case "generate_hr_document": {
      const p = action.payload as {
        documentType?: string;
        subjectName?: string;
        contextFields?: Record<string, string>;
        conversationId?: string;
        instructions?: string;
      };
      if (!p.documentType || !p.subjectName) {
        throw new Error("documentType and subjectName are required.");
      }
      if (!HR_DOC_TYPES.has(p.documentType)) {
        throw new Error(`Unsupported HR document type: ${p.documentType}`);
      }

      const hrStore = getHrStore();
      const now = crmNow();
      const hrCase = await hrStore.createCase({
        ...scope,
        conversationId: p.conversationId ?? `manual_${crmNow()}`,
        subjectName: p.subjectName,
        proposedAction: "generate_document",
        proposedDocumentType: p.documentType as HrDocumentType,
        contextFields: p.contextFields ?? {},
        riskTier: "high",
        riskReasons: ["Created via AI HR Manager action"],
        status: "triaging",
        aiSummary: p.instructions ?? action.label,
        confidence: 0.9,
        createdAt: now,
        updatedAt: now,
      });

      await publishDomainEvent({
        scope,
        type: "hr.case.created",
        actor: { type: "ai_agent", id: "hr_manager", name: "AI HR Manager" },
        entityType: "hr_case",
        entityId: hrCase.id,
        payload: { source: "workforce_action" },
        source: "ai",
      });

      scheduleProcessHrCase(hrCase.id, scope);

      return {
        kind: "hr_case",
        id: hrCase.id,
        message: `HR case created for ${p.documentType.replace(/_/g, " ")} — ${p.subjectName}`,
      };
    }
    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}

import { getCrmRepository } from "@/lib/data/crm-store";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { getNotificationsRepository } from "@/lib/data/notifications-store";
import { getRepository } from "@/lib/data/repository";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { publishDomainEvent } from "@/lib/events/publish";
import {
  canAutoSendSupportReply,
  classifyDocumentRisk,
} from "@/lib/hr/document-risk";
import { labelForHrDocumentType } from "@/lib/hr/document-types";
import { generateHrDocument } from "@/lib/hr/generate-document";
import { sendHrDocument, sendHrSupportReply } from "@/lib/hr/send-document";
import { validateHrDocumentRules } from "@/lib/hr/validate-rules";
import type { TenantScope } from "@/types/communication";
import type { HrCase } from "@/types/hr-case";

async function prefillContextFields(
  hrCase: HrCase,
  scope: TenantScope
): Promise<Record<string, string>> {
  const fields = { ...hrCase.contextFields };
  const hrStore = getHrStore();

  if (hrCase.subjectId && hrCase.subjectKind === "employee") {
    const employee = await hrStore.getEmployee(hrCase.subjectId, scope);
    if (employee) {
      fields.jobTitle ||= employee.role;
      fields.department ||= employee.department;
      fields.employmentFrom ||= employee.startDate;
      fields.employmentStart ||= employee.startDate;
    }
  }

  if (hrCase.subjectId && hrCase.subjectKind === "candidate") {
    const candidate = await hrStore.get(hrCase.subjectId, scope);
    if (candidate) {
      fields.jobTitle ||= candidate.role;
    }
  }

  return fields;
}

async function escalateHrCase(hrCase: HrCase, scope: TenantScope): Promise<void> {
  const hrStore = getHrStore();
  const crm = getCrmRepository();
  const now = crmNow();

  await crm.createTask(
    {
      title: `HR escalation: ${hrCase.subjectName}`,
      description: hrCase.aiSummary,
      priority: "high",
      contactId: hrCase.contactId,
      source: "ai",
      assignedAgentType: "hr_manager",
    },
    scope
  );

  await getNotificationsRepository().createNotification(
    {
      title: "HR case escalated",
      body: `${hrCase.subjectName} requires human review — ${hrCase.aiSummary}`,
      kind: "alert",
      priority: "high",
      actionUrl: `/inbox/${hrCase.conversationId}`,
      source: "hr_automation",
    },
    scope
  );

  await hrStore.setCase({
    ...hrCase,
    status: "pending_approval",
    updatedAt: now,
  });
}

export async function processHrCase(caseId: string, scope: TenantScope): Promise<void> {
  const hrStore = getHrStore();
  let hrCase = await hrStore.getCase(caseId, scope);
  if (!hrCase || hrCase.status === "sent" || hrCase.status === "dismissed") {
    return;
  }

  const conversation = await getRepository().getConversation(
    hrCase.conversationId,
    scope
  );
  if (!conversation) {
    await hrStore.setCase({
      ...hrCase,
      status: "failed",
      aiSummary: `${hrCase.aiSummary} (conversation missing)`,
      updatedAt: crmNow(),
    });
    return;
  }

  const now = crmNow();

  if (hrCase.proposedAction === "escalate_human") {
    await escalateHrCase(hrCase, scope);
    return;
  }

  if (hrCase.proposedAction === "support_reply") {
    if (!canAutoSendSupportReply(conversation.sentiment)) {
      await hrStore.setCase({
        ...hrCase,
        status: "pending_approval",
        riskTier: "high",
        riskReasons: [...hrCase.riskReasons, "Urgent sentiment — reply needs approval"],
        updatedAt: now,
      });
      return;
    }

    const reply =
      hrCase.supportReply ??
      `Hi ${hrCase.subjectName},\n\nThank you for your message. Our HR team has reviewed your enquiry and will follow up shortly.\n\nBest regards,\nHR Team`;

    await sendHrSupportReply({ scope, hrCase, content: reply });
    await hrStore.setCase({
      ...hrCase,
      status: "sent",
      resolvedAt: now,
      updatedAt: now,
    });

    await publishDomainEvent({
      scope,
      type: "hr.case.resolved",
      actor: { type: "system", id: "hr-automation", name: "HR Automation" },
      entityType: "hr_case",
      entityId: hrCase.id,
      payload: { action: "support_reply" },
      source: "system",
    });
    return;
  }

  if (hrCase.proposedAction !== "generate_document" || !hrCase.proposedDocumentType) {
    await hrStore.setCase({
      ...hrCase,
      status: "dismissed",
      resolvedAt: now,
      updatedAt: now,
    });
    return;
  }

  const docType = hrCase.proposedDocumentType;

  await hrStore.setCase({ ...hrCase, status: "generating", updatedAt: now });
  hrCase = (await hrStore.getCase(caseId, scope))!;

  const contextFields = await prefillContextFields(hrCase, scope);
  const { tier, reasons } = classifyDocumentRisk({
    documentType: docType,
    sentiment: conversation.sentiment,
    confidence: hrCase.confidence,
    contextFields,
  });

  const rules = validateHrDocumentRules({
    documentType: docType,
    contextFields,
    autoSend: tier === "low",
  });

  if (!rules.allowed) {
    await hrStore.setCase({
      ...hrCase,
      status: "failed",
      contextFields,
      riskTier: "high",
      riskReasons: [...reasons, rules.message],
      aiSummary: rules.message,
      updatedAt: crmNow(),
    });
    return;
  }

  const org = await getTenantRepository().getOrganization(scope.tenantId);
  const title = `${labelForHrDocumentType(docType)} — ${hrCase.subjectName}`;

  const content = await generateHrDocument({
    type: docType,
    title,
    subjectName: hrCase.subjectName,
    instructions: hrCase.aiSummary,
    contextFields,
    companyName: org?.name ?? "Your Company",
    authorName: "HR Automation",
  });

  const document = await hrStore.createDocument({
    ...scope,
    type: docType,
    title,
    subjectName: hrCase.subjectName,
    subjectId: hrCase.subjectId,
    subjectKind: hrCase.subjectKind,
    status: "draft",
    instructions: hrCase.aiSummary,
    contextFields,
    content,
    createdByName: "HR Automation",
    createdAt: now,
    updatedAt: now,
  });

  await publishDomainEvent({
    scope,
    type: "hr.document.generated",
    actor: { type: "ai_agent", id: "hr_manager", name: "AI HR Manager" },
    entityType: "document",
    entityId: document.id,
    payload: {
      hrDocumentType: document.type,
      title: document.title,
      subjectName: document.subjectName,
      hrCaseId: hrCase.id,
      automated: true,
    },
    source: "ai",
  });

  const needsApproval = tier === "high" || rules.approvalRequired;

  hrCase = {
    ...hrCase,
    contextFields,
    documentId: document.id,
    riskTier: needsApproval ? "high" : tier,
    riskReasons: [
      ...reasons,
      ...(rules.approvalRequired && rules.reason ? [rules.reason] : []),
    ],
    updatedAt: crmNow(),
  };

  if (needsApproval) {
    await hrStore.setCase({
      ...hrCase,
      status: "pending_approval",
    });
    await getNotificationsRepository().createNotification(
      {
        title: "HR document awaiting approval",
        body: `${title} — review before sending.`,
        kind: "notification",
        priority: "high",
        actionUrl: `/inbox/${hrCase.conversationId}`,
        source: "hr_automation",
      },
      scope
    );
    return;
  }

  await hrStore.setCase({ ...hrCase, status: "ready_to_send" });
  await sendHrDocument({ scope, document, hrCase: { ...hrCase, status: "ready_to_send" } });

  await publishDomainEvent({
    scope,
    type: "hr.case.resolved",
    actor: { type: "system", id: "hr-automation", name: "HR Automation" },
    entityType: "hr_case",
    entityId: hrCase.id,
    payload: { action: "generate_document", autoSent: true },
    source: "system",
  });
}

export async function approveHrCase(
  caseId: string,
  scope: TenantScope,
  patch?: { contextFields?: Record<string, string> }
): Promise<HrCase> {
  const hrStore = getHrStore();
  const hrCase = await hrStore.getCase(caseId, scope);
  if (!hrCase) throw new Error("HR case not found.");
  if (hrCase.status !== "pending_approval" && hrCase.status !== "ready_to_send") {
    throw new Error("Case is not awaiting approval.");
  }

  const now = crmNow();
  let documentId = hrCase.documentId;

  if (patch?.contextFields && documentId) {
    const document = await hrStore.getDocument(documentId, scope);
    if (document) {
      const org = await getTenantRepository().getOrganization(scope.tenantId);
      const content = await generateHrDocument({
        type: document.type,
        title: document.title,
        subjectName: document.subjectName,
        instructions: document.instructions,
        contextFields: { ...document.contextFields, ...patch.contextFields },
        companyName: org?.name ?? "Your Company",
        authorName: "HR Manager",
      });
      await hrStore.setDocument({
        ...document,
        contextFields: { ...document.contextFields, ...patch.contextFields },
        content,
        updatedAt: now,
      });
    }
  }

  const updatedCase = await hrStore.setCase({
    ...hrCase,
    contextFields: { ...hrCase.contextFields, ...(patch?.contextFields ?? {}) },
    status: "ready_to_send",
    updatedAt: now,
  });

  await publishDomainEvent({
    scope,
    type: "hr.case.resolved",
    actor: { type: "user", id: "hr-admin", name: "HR Admin" },
    entityType: "hr_case",
    entityId: hrCase.id,
    payload: { documentId, approved: true },
    source: "api",
  });

  if (documentId) {
    const document = await hrStore.getDocument(documentId, scope);
    if (document) {
      await sendHrDocument({ scope, document, hrCase: updatedCase });
    }
  } else if (hrCase.proposedAction === "support_reply" && hrCase.supportReply) {
    await sendHrSupportReply({
      scope,
      hrCase: updatedCase,
      content: hrCase.supportReply,
    });
    await hrStore.setCase({
      ...updatedCase,
      status: "sent",
      resolvedAt: now,
      updatedAt: now,
    });
  }

  return (await hrStore.getCase(caseId, scope)) ?? updatedCase;
}

export function scheduleProcessHrCase(caseId: string, scope: TenantScope): void {
  void processHrCase(caseId, scope).catch((error) => {
    console.error(
      `[hr:process-case] case=${caseId}`,
      error instanceof Error ? error.message : error
    );
  });
}

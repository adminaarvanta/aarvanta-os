import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { getNotificationsRepository } from "@/lib/data/notifications-store";
import { publishDomainEvent } from "@/lib/events/publish";
import { classifyDocumentRisk } from "@/lib/hr/document-risk";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getHrWorkspaceSettings, hydrateWorkspaceSettingsCache } from "@/lib/hr/settings";
import { scheduleProcessHrCase } from "@/lib/hr/process-case";
import type { Conversation, TenantScope } from "@/types/communication";
import type { HrCase, HrCaseAction } from "@/types/hr-case";
import type { HrDocumentType } from "@/types/platform-modules";

const HR_KEYWORDS =
  /\b(offer letter|experience letter|employment (letter|proof|verification)|relieving|salary certificate|leave balance|onboarding|nda|warning letter|appointment letter|hr department|human resources|payslip|probation)\b/i;

export type HrCaseEvaluation = {
  action: HrCaseAction;
  documentType?: HrDocumentType;
  contextFields: Record<string, string>;
  subjectName: string;
  subjectKind?: "employee" | "candidate" | "vendor" | "other";
  subjectId?: string;
  confidence: number;
  reasoning: string;
  supportReply?: string;
};

type AiEvaluationResponse = {
  action?: string;
  documentType?: string;
  contextFields?: Record<string, string>;
  subjectName?: string;
  subjectKind?: string;
  confidence?: number;
  reasoning?: string;
  supportReply?: string;
};

const VALID_DOC_TYPES = new Set<string>([
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

function timelineToText(conversation: Conversation): string {
  return conversation.timeline
    .map((event) => {
      if (event.type === "message") {
        return `[${event.direction}] ${event.content}`;
      }
      if (event.type === "email") {
        return `[email ${event.direction}] ${event.subject}: ${event.bodyPreview}`;
      }
      if (event.type === "note") {
        return `[note] ${event.content}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export function shouldEvaluateHrCase(conversation: Conversation): boolean {
  const transcript = timelineToText(conversation);
  if (conversation.aiIntent === "support") return true;
  return HR_KEYWORDS.test(transcript);
}

function matchRosterSubject(
  conversation: Conversation,
  employees: Awaited<ReturnType<ReturnType<typeof getHrStore>["listEmployees"]>>,
  candidates: Awaited<ReturnType<ReturnType<typeof getHrStore>["list"]>>
): {
  subjectName: string;
  subjectKind: "employee" | "candidate" | "other";
  subjectId?: string;
  contextFields: Record<string, string>;
} {
  const name = conversation.contact.name.toLowerCase();
  const employee = employees.find((item) => item.name.toLowerCase() === name);
  if (employee) {
    return {
      subjectName: employee.name,
      subjectKind: "employee" as const,
      subjectId: employee.id,
      contextFields: {
        jobTitle: employee.role,
        department: employee.department,
        employmentFrom: employee.startDate,
        employmentStart: employee.startDate,
      },
    };
  }

  const candidate = candidates.find((item) => item.name.toLowerCase() === name);
  if (candidate) {
    return {
      subjectName: candidate.name,
      subjectKind: "candidate" as const,
      subjectId: candidate.id,
      contextFields: {
        jobTitle: candidate.role,
      },
    };
  }

  return {
    subjectName: conversation.contact.name,
    subjectKind: "other" as const,
    contextFields: {},
  };
}

function heuristicEvaluation(
  conversation: Conversation,
  roster: ReturnType<typeof matchRosterSubject>
): HrCaseEvaluation {
  const transcript = timelineToText(conversation).toLowerCase();

  if (
    /\bcomplaint|lawyer|legal action|unacceptable|filing\b/.test(transcript) ||
    conversation.sentiment === "frustrated"
  ) {
    return {
      action: "escalate_human",
      contextFields: roster.contextFields,
      subjectName: roster.subjectName,
      subjectKind: roster.subjectKind,
      subjectId: roster.subjectId,
      confidence: 0.82,
      reasoning: "Sensitive or escalated tone detected — route to HR staff.",
    };
  }

  if (/\bleave balance|annual leave|holiday\b/.test(transcript)) {
    const employee = roster.subjectKind === "employee";
    const leaveHint = employee ? "18 days" : "your current balance";
    return {
      action: "support_reply",
      contextFields: roster.contextFields,
      subjectName: roster.subjectName,
      subjectKind: roster.subjectKind,
      subjectId: roster.subjectId,
      confidence: 0.78,
      reasoning: "Employee asked about leave — informational reply.",
      supportReply: `Hi ${roster.subjectName},\n\nThank you for reaching out. Your remaining annual leave balance is ${leaveHint}. If you need a formal leave statement, reply and we can arrange one.\n\nBest regards,\nHR Team`,
    };
  }

  if (/\bexperience letter|employment proof|employment verification\b/.test(transcript)) {
    return {
      action: "generate_document",
      documentType: "experience_letter",
      contextFields: roster.contextFields,
      subjectName: roster.subjectName,
      subjectKind: roster.subjectKind,
      subjectId: roster.subjectId,
      confidence: 0.85,
      reasoning: "Request for employment/experience documentation.",
    };
  }

  if (/\bsalary certificate|proof of income\b/.test(transcript)) {
    return {
      action: "generate_document",
      documentType: "salary_certificate",
      contextFields: roster.contextFields,
      subjectName: roster.subjectName,
      subjectKind: roster.subjectKind,
      subjectId: roster.subjectId,
      confidence: 0.84,
      reasoning: "Salary certificate requested.",
    };
  }

  if (/\boffer letter|\boffer\b/.test(transcript)) {
    return {
      action: "generate_document",
      documentType: "offer_letter",
      contextFields: roster.contextFields,
      subjectName: roster.subjectName,
      subjectKind: roster.subjectKind,
      subjectId: roster.subjectId,
      confidence: 0.8,
      reasoning: "Candidate or employee asked about an offer letter.",
    };
  }

  return {
    action: "none",
    contextFields: {},
    subjectName: roster.subjectName,
    confidence: 0.4,
    reasoning: "No clear HR document or support action identified.",
  };
}

async function aiEvaluation(
  conversation: Conversation,
  roster: ReturnType<typeof matchRosterSubject>,
  employees: Awaited<ReturnType<ReturnType<typeof getHrStore>["listEmployees"]>>
): Promise<HrCaseEvaluation> {
  const system = `You are the HR triage agent for Aarvanta OS Unified Inbox.
Analyze the conversation and decide if HR should act.

Respond ONLY with JSON:
{
  "action": "none" | "support_reply" | "generate_document" | "escalate_human",
  "documentType": "<one of offer_letter, experience_letter, appointment_letter, relieving_letter, salary_certificate, employment_verification, corporate_invoice, nda, policy_memo, warning_letter, custom_corporate>",
  "contextFields": { "jobTitle": "...", "startDate": "...", "salary": "..." },
  "subjectName": "string",
  "subjectKind": "employee" | "candidate" | "other",
  "confidence": 0.0-1.0,
  "reasoning": "short explanation",
  "supportReply": "draft reply when action is support_reply"
}

Use escalate_human for complaints, legal threats, or disciplinary disputes.
Use generate_document only when a formal HR document is clearly requested.
Use support_reply for simple HR questions (leave balance, policies) without a formal letter.`;

  const user = JSON.stringify({
    contact: conversation.contact,
    sentiment: conversation.sentiment,
    aiIntent: conversation.aiIntent,
    aiSummary: conversation.aiSummary,
    roster: employees.map((e) => ({
      name: e.name,
      role: e.role,
      department: e.department,
      leaveBalance: e.leaveBalance,
    })),
    transcript: timelineToText(conversation),
    matchedSubject: roster,
  });

  const raw = await completeJson<AiEvaluationResponse>({ system, user });
  const action = (raw.action ?? "none") as HrCaseAction;
  const documentType =
    raw.documentType && VALID_DOC_TYPES.has(raw.documentType)
      ? (raw.documentType as HrDocumentType)
      : undefined;

  return {
    action,
    documentType,
    contextFields: { ...roster.contextFields, ...(raw.contextFields ?? {}) },
    subjectName: raw.subjectName?.trim() || roster.subjectName,
    subjectKind:
      raw.subjectKind === "employee" ||
      raw.subjectKind === "candidate" ||
      raw.subjectKind === "other"
        ? raw.subjectKind
        : roster.subjectKind,
    subjectId: roster.subjectId,
    confidence: Math.min(1, Math.max(0, raw.confidence ?? 0.5)),
    reasoning: raw.reasoning?.trim() || "AI triage completed.",
    supportReply: raw.supportReply?.trim(),
  };
}

export async function evaluateHrCaseFromConversation(
  conversation: Conversation,
  scope: TenantScope
): Promise<HrCaseEvaluation | null> {
  if (!shouldEvaluateHrCase(conversation)) return null;

  const hrStore = getHrStore();
  const [employees, candidates] = await Promise.all([
    hrStore.listEmployees(scope),
    hrStore.list(scope),
  ]);

  const roster = matchRosterSubject(conversation, employees, candidates);
  const evaluation = isAiConfigured()
    ? await aiEvaluation(conversation, roster, employees)
    : heuristicEvaluation(conversation, roster);

  if (evaluation.action === "none") return evaluation;
  return evaluation;
}

export async function createHrCaseFromEvaluation(
  conversation: Conversation,
  scope: TenantScope,
  evaluation: HrCaseEvaluation
): Promise<HrCase | null> {
  const hrStore = getHrStore();
  const existing = await hrStore.findOpenCaseByConversation(
    conversation.id,
    scope
  );
  if (existing) return existing;

  const { tier, reasons } =
    evaluation.action === "generate_document"
      ? classifyDocumentRisk({
          documentType: evaluation.documentType,
          sentiment: conversation.sentiment,
          confidence: evaluation.confidence,
          contextFields: evaluation.contextFields,
        })
      : { tier: "low" as const, reasons: [] as string[] };

  const now = crmNow();
  const hrCase = await hrStore.createCase({
    ...scope,
    conversationId: conversation.id,
    contactId: conversation.contact.id,
    subjectName: evaluation.subjectName,
    subjectKind: evaluation.subjectKind,
    subjectId: evaluation.subjectId,
    proposedAction: evaluation.action,
    proposedDocumentType: evaluation.documentType,
    contextFields: evaluation.contextFields,
    supportReply: evaluation.supportReply,
    riskTier: tier,
    riskReasons: reasons,
    status: "triaging",
    aiSummary: evaluation.reasoning,
    confidence: evaluation.confidence,
    createdAt: now,
    updatedAt: now,
  });

  await publishDomainEvent({
    scope,
    type: "ai.decision.proposed",
    actor: { type: "ai_agent", id: "hr_manager", name: "AI HR Manager" },
    entityType: "hr_case",
    entityId: hrCase.id,
    payload: {
      conversationId: conversation.id,
      action: evaluation.action,
      documentType: evaluation.documentType,
      confidence: evaluation.confidence,
      riskTier: tier,
    },
    source: "ai",
  });

  await publishDomainEvent({
    scope,
    type: "hr.case.created",
    actor: { type: "ai_agent", id: "hr_manager", name: "AI HR Manager" },
    entityType: "hr_case",
    entityId: hrCase.id,
    payload: {
      conversationId: conversation.id,
      proposedAction: evaluation.action,
      riskTier: tier,
    },
    source: "ai",
  });

  scheduleProcessHrCase(hrCase.id, scope);

  return hrCase;
}

export async function runHrCaseEvaluation(
  conversationId: string,
  scope: TenantScope
): Promise<void> {
  await hydrateWorkspaceSettingsCache(scope.workspaceId);
  const settings = await getHrWorkspaceSettings(scope.workspaceId);
  if (!settings.inboxAutomationEnabled) return;

  await ensureHrPlatformSeed(scope);

  const { getRepository } = await import("@/lib/data/repository");
  const conversation = await getRepository().getConversation(conversationId, scope);
  if (!conversation) return;

  const evaluation = await evaluateHrCaseFromConversation(conversation, scope);
  if (!evaluation) return;

  if (evaluation.action === "none") {
    if (evaluation.confidence < 0.65 && shouldEvaluateHrCase(conversation)) {
      await getNotificationsRepository().createNotification(
        {
          title: "HR review suggested",
          body: `Inbox thread with ${conversation.contact.name} may need HR attention.`,
          kind: "notification",
          priority: "medium",
          actionUrl: `/inbox/${conversation.id}`,
          source: "hr_automation",
        },
        scope
      );
    }
    return;
  }

  if (evaluation.confidence < 0.65) {
    await getNotificationsRepository().createNotification(
      {
        title: "Low-confidence HR case",
        body: `${conversation.contact.name}: ${evaluation.reasoning}`,
        kind: "notification",
        priority: "medium",
        actionUrl: `/inbox/${conversation.id}`,
        source: "hr_automation",
      },
      scope
    );
    return;
  }

  await createHrCaseFromEvaluation(conversation, scope, evaluation);
}

export function scheduleHrCaseEvaluation(
  conversationId: string,
  scope: TenantScope
): void {
  void runHrCaseEvaluation(conversationId, scope).catch((error) => {
    console.error(
      `[hr:case-evaluation] conversation=${conversationId}`,
      error instanceof Error ? error.message : error
    );
  });
}

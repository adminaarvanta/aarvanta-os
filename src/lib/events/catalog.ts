import type { DomainEventType } from "@/types/events";

export const DOMAIN_EVENT_LABELS: Record<DomainEventType, string> = {
  "deal.created": "Deal created",
  "deal.updated": "Deal updated",
  "deal.won": "Deal won",
  "deal.lost": "Deal lost",
  "contact.created": "Contact created",
  "contact.updated": "Contact updated",
  "company.created": "Company created",
  "company.updated": "Company updated",
  "task.created": "Task created",
  "task.updated": "Task updated",
  "task.completed": "Task completed",
  "activity.logged": "Activity logged",
  "ai.decision.proposed": "AI decision proposed",
  "ai.decision.executed": "AI decision executed",
  "workflow.started": "Workflow started",
  "workflow.completed": "Workflow completed",
  "member.invited": "Member invited",
  "member.updated": "Member updated",
  "hr.document.generated": "HR document generated",
  "hr.document.sent": "HR document sent",
  "hr.document.approved": "HR document approved",
  "hr.case.created": "HR case created",
  "hr.case.resolved": "HR case resolved",
  "conversation.message.inbound": "Inbound message received",
};

export function labelForEventType(type: DomainEventType): string {
  return DOMAIN_EVENT_LABELS[type] ?? type;
}

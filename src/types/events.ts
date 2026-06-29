import type { TenantScope } from "@/types/communication";
import type { ActorRef } from "@/types/identity";
import type { EntityType } from "@/types/entity";

/** Canonical domain event — every business mutation emits one. */
export type DomainEvent = TenantScope & {
  id: string;
  type: DomainEventType;
  timestamp: string;
  actor: ActorRef;
  entityType: EntityType;
  entityId: string;
  payload: Record<string, unknown>;
  source: EventSource;
  correlationId?: string;
};

export type EventSource = "api" | "workflow" | "ai" | "system" | "webhook";

export type DomainEventType =
  | "deal.created"
  | "deal.updated"
  | "deal.won"
  | "deal.lost"
  | "contact.created"
  | "contact.updated"
  | "company.created"
  | "company.updated"
  | "task.created"
  | "task.updated"
  | "task.completed"
  | "activity.logged"
  | "ai.decision.proposed"
  | "ai.decision.executed"
  | "workflow.started"
  | "workflow.completed"
  | "member.invited"
  | "member.updated"
  | "hr.document.generated"
  | "hr.document.sent"
  | "hr.document.approved"
  | "hr.case.created"
  | "hr.case.resolved"
  | "conversation.message.inbound";

export type ListDomainEventsFilters = {
  type?: DomainEventType;
  entityType?: EntityType;
  entityId?: string;
  limit?: number;
};

export type PublishDomainEventInput = {
  scope: TenantScope;
  type: DomainEventType;
  actor: ActorRef;
  entityType: EntityType;
  entityId: string;
  payload?: Record<string, unknown>;
  source?: EventSource;
  correlationId?: string;
};

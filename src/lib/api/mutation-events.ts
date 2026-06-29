import type { SessionContext } from "@/lib/tenant/context";
import { actorFromSession } from "@/lib/identity/from-session";
import { publishDomainEvent } from "@/lib/events/publish";
import type { DomainEventType } from "@/types/events";
import type { EntityType } from "@/types/entity";

type RecordMutationEventInput = {
  ctx: SessionContext;
  type: DomainEventType;
  entityType: EntityType;
  entityId: string;
  payload?: Record<string, unknown>;
};

/** Record a domain event after a successful API mutation. */
export async function recordMutationEvent(input: RecordMutationEventInput) {
  return publishDomainEvent({
    scope: input.ctx.scope,
    type: input.type,
    actor: actorFromSession(input.ctx),
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload,
    source: "api",
  });
}

/** Shorthand when only tenant scope is available (read-only routes). */
export async function recordScopedMutationEvent(
  scope: SessionContext["scope"],
  actor: SessionContext,
  type: DomainEventType,
  entityType: EntityType,
  entityId: string,
  payload?: Record<string, unknown>
) {
  return recordMutationEvent({
    ctx: actor,
    type,
    entityType,
    entityId,
    payload,
  });
}

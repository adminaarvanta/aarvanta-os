import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { getEventRepository } from "@/lib/data/event-store";
import type { DomainEvent, PublishDomainEventInput } from "@/types/events";

type EventListener = (event: DomainEvent) => void | Promise<void>;

const listeners = new Map<string, EventListener[]>();
const wildcardListeners: EventListener[] = [];

/** Subscribe to domain events (in-process consumers for Phase 1). */
export function onDomainEvent(
  eventType: string | "*",
  handler: EventListener
): () => void {
  if (eventType === "*") {
    wildcardListeners.push(handler);
    return () => {
      const idx = wildcardListeners.indexOf(handler);
      if (idx >= 0) wildcardListeners.splice(idx, 1);
    };
  }

  const list = listeners.get(eventType) ?? [];
  list.push(handler);
  listeners.set(eventType, list);

  return () => {
    const current = listeners.get(eventType) ?? [];
    const idx = current.indexOf(handler);
    if (idx >= 0) {
      current.splice(idx, 1);
      listeners.set(eventType, current);
    }
  };
}

async function dispatch(event: DomainEvent) {
  const typed = listeners.get(event.type) ?? [];
  await Promise.all([
    ...wildcardListeners.map((handler) => handler(event)),
    ...typed.map((handler) => handler(event)),
  ]);
}

/** Persist and broadcast a domain event. */
export async function publishDomainEvent(
  input: PublishDomainEventInput
): Promise<DomainEvent> {
  const event: DomainEvent = {
    ...input.scope,
    id: crmNewId("evt"),
    type: input.type,
    timestamp: crmNow(),
    actor: input.actor,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload ?? {},
    source: input.source ?? "api",
    correlationId: input.correlationId,
  };

  const stored = await getEventRepository().append(event);
  await dispatch(stored);
  return stored;
}

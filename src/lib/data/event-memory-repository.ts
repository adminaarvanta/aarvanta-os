import { inCrmScope } from "@/lib/data/crm-helpers";
import type { EventRepository } from "@/lib/data/event-repository";
import type { TenantScope } from "@/types/communication";
import type { DomainEvent, ListDomainEventsFilters } from "@/types/events";

let events: DomainEvent[] = [];

export const eventMemoryRepository: EventRepository = {
  async append(event) {
    events = [event, ...events];
    return event;
  },

  async list(scope, filters) {
    const limit = filters?.limit ?? 100;
    let items = events.filter((event) => inCrmScope(event, scope));

    if (filters?.type) {
      items = items.filter((event) => event.type === filters.type);
    }
    if (filters?.entityType) {
      items = items.filter((event) => event.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      items = items.filter((event) => event.entityId === filters.entityId);
    }

    return items
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  },

  async get(id, scope) {
    const event = events.find((item) => item.id === id);
    return event && inCrmScope(event, scope) ? event : null;
  },
};

/** Test helper — reset in-memory event store. */
export function resetEventMemoryStore() {
  events = [];
}

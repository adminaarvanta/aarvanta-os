import type { TenantScope } from "@/types/communication";
import type {
  DomainEvent,
  ListDomainEventsFilters,
} from "@/types/events";

export interface EventRepository {
  append(event: DomainEvent): Promise<DomainEvent>;
  list(scope: TenantScope, filters?: ListDomainEventsFilters): Promise<DomainEvent[]>;
  get(id: string, scope: TenantScope): Promise<DomainEvent | null>;
}

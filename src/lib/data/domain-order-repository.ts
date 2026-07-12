import type { TenantScope } from "@/types/communication";
import type { DomainOrder } from "@/types/site-builder";

export type DomainOrderRepository = {
  list(scope: TenantScope): Promise<DomainOrder[]>;
  get(id: string, scope: TenantScope): Promise<DomainOrder | null>;
  save(order: DomainOrder): Promise<DomainOrder>;
};

import { inCrmScope } from "@/lib/data/crm-helpers";
import type { DomainOrderRepository } from "@/lib/data/domain-order-repository";
import type { DomainOrder } from "@/types/site-builder";
import type { TenantScope } from "@/types/communication";

const orders: DomainOrder[] = [];

export const domainOrderMemoryRepository: DomainOrderRepository = {
  async list(scope) {
    return orders
      .filter((o) => inCrmScope(o, scope))
      .sort(
        (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
      );
  },

  async get(id, scope) {
    const item = orders.find((o) => o.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async save(order) {
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx === -1) orders.unshift(order);
    else orders[idx] = order;
    return order;
  },
};

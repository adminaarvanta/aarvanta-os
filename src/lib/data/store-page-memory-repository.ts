import { inCrmScope } from "@/lib/data/crm-helpers";
import type { StorePageRepository } from "@/lib/data/store-page-repository";
import type { GeneratedStorePage } from "@/types/store-page";
import type { TenantScope } from "@/types/communication";

const pages: GeneratedStorePage[] = [];
const bySlug = new Map<string, GeneratedStorePage>();

export const storePageMemoryRepository: StorePageRepository = {
  async list(scope) {
    return pages.filter((p) => inCrmScope(p, scope));
  },

  async get(id, scope) {
    const item = pages.find((p) => p.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async getBySlug(slug) {
    return bySlug.get(slug) ?? pages.find((p) => p.slug === slug && p.published) ?? null;
  },

  async save(page) {
    const idx = pages.findIndex((p) => p.id === page.id);
    if (idx === -1) pages.unshift(page);
    else pages[idx] = page;
    bySlug.set(page.slug, page);
    return page;
  },

  async remove(id, scope) {
    const idx = pages.findIndex((p) => p.id === id && inCrmScope(p, scope));
    if (idx === -1) return false;
    const removed = pages[idx]!;
    pages.splice(idx, 1);
    if (bySlug.get(removed.slug)?.id === removed.id) bySlug.delete(removed.slug);
    return true;
  },
};

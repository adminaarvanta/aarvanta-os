import type { GeneratedStorePage } from "@/types/store-page";
import type { TenantScope } from "@/types/communication";

export type StorePageRepository = {
  list(scope: TenantScope): Promise<GeneratedStorePage[]>;
  get(id: string, scope: TenantScope): Promise<GeneratedStorePage | null>;
  getBySlug(slug: string): Promise<GeneratedStorePage | null>;
  save(page: GeneratedStorePage): Promise<GeneratedStorePage>;
  remove(id: string, scope: TenantScope): Promise<boolean>;
};

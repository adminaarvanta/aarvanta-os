import type { TenantScope } from "@/types/communication";
import type { LaunchSession } from "@/types/launch";

export type LaunchRepository = {
  list(scope: TenantScope): Promise<LaunchSession[]>;
  get(id: string, scope: TenantScope): Promise<LaunchSession | null>;
  save(session: LaunchSession): Promise<LaunchSession>;
  remove(id: string, scope: TenantScope): Promise<boolean>;
};

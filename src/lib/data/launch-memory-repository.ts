import { crmNow, crmNewId, inCrmScope } from "@/lib/data/crm-helpers";
import type { LaunchRepository } from "@/lib/data/launch-repository";
import type { TenantScope } from "@/types/communication";
import type { CreateLaunchSessionInput, LaunchSession } from "@/types/launch";

let sessions: LaunchSession[] = [];

export const launchMemoryRepository: LaunchRepository = {
  async list(scope) {
    return sessions
      .filter((s) => inCrmScope(s, scope))
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async get(id, scope) {
    const item = sessions.find((s) => s.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async save(session) {
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx === -1) {
      sessions.unshift(session);
    } else {
      sessions[idx] = session;
    }
    return session;
  },

  async remove(id, scope) {
    const idx = sessions.findIndex((s) => s.id === id && inCrmScope(s, scope));
    if (idx === -1) return false;
    sessions.splice(idx, 1);
    return true;
  },
};

export function seedLaunchSession(
  scope: TenantScope,
  input: CreateLaunchSessionInput,
  partial?: Partial<LaunchSession>
): LaunchSession {
  const now = crmNow();
  return {
    ...scope,
    id: crmNewId("launch"),
    status: "draft",
    intent: input,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

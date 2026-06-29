import { cookies } from "next/headers";
import {
  createSessionToken,
  getSessionCookieOptions,
  getSessionFromCookies,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config/app-mode";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { WORKSPACE_COOKIE } from "@/lib/tenant/demo-context";
import type { TenantScope } from "@/types/communication";

/** Update the session cookie to a workspace the user can access. */
export async function switchSessionToScope(target: TenantScope): Promise<boolean> {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, JSON.stringify(target), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return true;
  }

  const session = await getSessionFromCookies();
  if (!session) return false;

  const repo = getTenantRepository();
  let membership = await repo.getMemberByUser(session.userId, target);

  if (!membership && session.role === "owner") {
    const workspace = await repo.getWorkspace(target.workspaceId);
    if (workspace && workspace.tenantId === session.tenantId) {
      await repo.createMember(
        {
          userId: session.userId,
          email: session.email,
          name: session.name,
          role: session.role,
        },
        target
      );
      membership = await repo.getMemberByUser(session.userId, target);
    }
  }

  if (!membership) return false;

  const token = await createSessionToken({
    email: session.email,
    name: session.name,
    userId: session.userId,
    role: membership.role,
    tenantId: target.tenantId,
    workspaceId: target.workspaceId,
    companyId: target.companyId,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());
  return true;
}

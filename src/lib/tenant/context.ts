import { cache } from "react";
import { isDemoMode } from "@/lib/config/app-mode";
import { getSessionFromCookies, sessionToScope } from "@/lib/auth/session";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import {
  DEMO_TENANT,
  DEMO_USER,
  WORKSPACE_COOKIE,
} from "@/lib/tenant/demo-context";
import { can, type Permission } from "@/lib/tenant/permissions";
import type { TenantScope } from "@/types/communication";
import type { MemberRole, WorkspaceMember } from "@/types/tenant";
import { cookies } from "next/headers";

export interface SessionContext {
  userId: string;
  email: string;
  name: string;
  role: MemberRole;
  scope: TenantScope;
  member: WorkspaceMember | null;
}

const getSessionFromCookiesCached = cache(getSessionFromCookies);

function withViewer(scope: TenantScope, userId: string, role: MemberRole): TenantScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    companyId: scope.companyId,
    ownerUserId: userId,
    viewerRole: role,
  };
}

async function getDemoScopeFromCookie(): Promise<TenantScope> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WORKSPACE_COOKIE)?.value;
  if (!raw) return { ...DEMO_TENANT, ownerUserId: DEMO_USER.userId, viewerRole: DEMO_USER.role };

  try {
    const parsed = JSON.parse(raw) as TenantScope;
    if (
      typeof parsed.tenantId === "string" &&
      typeof parsed.workspaceId === "string" &&
      typeof parsed.companyId === "string"
    ) {
      return withViewer(parsed, DEMO_USER.userId, DEMO_USER.role);
    }
  } catch {
    /* fall through */
  }
  return { ...DEMO_TENANT, ownerUserId: DEMO_USER.userId, viewerRole: DEMO_USER.role };
}

export const getTenantScope = cache(async (): Promise<TenantScope> => {
  await ensureDatastoreReady();

  if (isDemoMode()) {
    return getDemoScopeFromCookie();
  }

  const session = await getSessionFromCookiesCached();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return sessionToScope(session);
});

export const getSessionContext = cache(async (): Promise<SessionContext> => {
  await ensureDatastoreReady();

  if (isDemoMode()) {
    const scope = await getDemoScopeFromCookie();
    const repo = getTenantRepository();
    let member =
      (await repo.getMemberByUser(DEMO_USER.userId, scope)) ?? null;
    const { withResolvedCreditOverrides } = await import(
      "@/lib/billing/member-credits"
    );
    member = await withResolvedCreditOverrides(DEMO_USER.email, member);
    const role = member?.role ?? DEMO_USER.role;
    return {
      userId: DEMO_USER.userId,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      role,
      scope: withViewer(scope, DEMO_USER.userId, role),
      member,
    };
  }

  const session = await getSessionFromCookiesCached();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const scope = sessionToScope(session);
  const repo = getTenantRepository();
  let member =
    (await repo.getMemberByUser(session.userId, scope)) ?? null;

  // Scope/userId mismatches: fall back to any membership for this email
  // in the active workspace, then any active membership.
  if (!member) {
    const byEmail = await repo.listMembershipsForEmail(session.email);
    member =
      byEmail.find(
        (m) =>
          m.status === "active" &&
          m.workspaceId === scope.workspaceId &&
          m.tenantId === scope.tenantId
      ) ??
      byEmail.find((m) => m.status === "active") ??
      null;
  }

  const { withResolvedCreditOverrides } = await import(
    "@/lib/billing/member-credits"
  );
  member = await withResolvedCreditOverrides(session.email, member);

  const role = member?.role ?? session.role;
  return {
    userId: session.userId,
    email: session.email,
    name: member?.name || session.name,
    // Prefer live membership role so hierarchy changes apply immediately.
    role,
    scope: withViewer(scope, session.userId, role),
    member,
  };
});

export async function requirePermission(permission: Permission) {
  const ctx = await getSessionContext();
  if (!can(ctx.role, permission)) {
    throw new Error("Forbidden");
  }
  return ctx;
}

export async function getOptionalSession() {
  if (isDemoMode()) return null;
  return getSessionFromCookiesCached();
}

export function isProductionTenantConfigured(): boolean {
  return Boolean(
    process.env.TENANT_ID &&
      process.env.WORKSPACE_ID &&
      process.env.COMPANY_ID
  );
}

export function getProductionTenantScope(): TenantScope {
  const tenantId = process.env.TENANT_ID;
  const workspaceId = process.env.WORKSPACE_ID;
  const companyId = process.env.COMPANY_ID;
  if (!tenantId || !workspaceId || !companyId) {
    throw new Error(
      "Production tenant is not configured (TENANT_ID, WORKSPACE_ID, COMPANY_ID)."
    );
  }
  return { tenantId, workspaceId, companyId };
}

/** Webhooks use demo tenant in demo mode so inbound events appear in the inbox. */
export function getWebhookTenantScope(): TenantScope {
  if (isDemoMode()) return DEMO_TENANT;
  return getProductionTenantScope();
}

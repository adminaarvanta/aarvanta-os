import { cache } from "react";
import { isDemoMode } from "@/lib/config/app-mode";
import {
  getSessionFromCookies,
  getSessionFromRequest,
  sessionToScope,
  type SessionPayload,
} from "@/lib/auth/session";
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

function withViewer(
  scope: TenantScope,
  userId: string,
  role: MemberRole
): TenantScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    companyId: scope.companyId,
    ownerUserId: userId,
    viewerRole: role,
  };
}

async function getDemoScopeFromCookie(): Promise<TenantScope> {
  let raw: string | undefined;
  try {
    raw = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  } catch {
    raw = undefined;
  }
  if (!raw) {
    return {
      ...DEMO_TENANT,
      ownerUserId: DEMO_USER.userId,
      viewerRole: DEMO_USER.role,
    };
  }

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
  return {
    ...DEMO_TENANT,
    ownerUserId: DEMO_USER.userId,
    viewerRole: DEMO_USER.role,
  };
}

async function contextFromSession(
  session: SessionPayload
): Promise<SessionContext> {
  const scope = sessionToScope(session);
  let member: WorkspaceMember | null = null;
  try {
    const repo = getTenantRepository();
    member = (await repo.getMemberByUser(session.userId, scope)) ?? null;

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
  } catch (error) {
    console.warn(
      "[session] membership lookup failed; using JWT identity",
      error instanceof Error ? error.message : error
    );
  }

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
}

async function demoSessionContext(): Promise<SessionContext> {
  const scope = await getDemoScopeFromCookie();
  let member: WorkspaceMember | null = null;
  try {
    const repo = getTenantRepository();
    member = (await repo.getMemberByUser(DEMO_USER.userId, scope)) ?? null;
    const { withResolvedCreditOverrides } = await import(
      "@/lib/billing/member-credits"
    );
    member = await withResolvedCreditOverrides(DEMO_USER.email, member);
  } catch (error) {
    console.warn(
      "[session] demo membership lookup failed",
      error instanceof Error ? error.message : error
    );
  }
  const role = member?.role ?? DEMO_USER.role;
  return {
    userId: DEMO_USER.userId,
    email: DEMO_USER.email,
    name: member?.name || DEMO_USER.name,
    role,
    scope: withViewer(scope, DEMO_USER.userId, role),
    member,
  };
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
    return demoSessionContext();
  }

  const session = await getSessionFromCookiesCached();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return contextFromSession(session);
});

/** Route Handlers: read the session cookie from the incoming Request. */
export async function getSessionContextFromRequest(
  request: Request
): Promise<SessionContext> {
  await ensureDatastoreReady();

  if (isDemoMode()) {
    return demoSessionContext();
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return contextFromSession(session);
}

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

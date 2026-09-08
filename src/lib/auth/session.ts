import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import type { TenantScope } from "@/types/communication";
import type { MemberRole } from "@/types/tenant";

export { getSessionCookieOptions, shouldUseSecureCookies } from "@/lib/auth/cookie-options";

export const SESSION_COOKIE = "aarvanta_session";

export interface SessionPayload {
  email: string;
  name: string;
  userId: string;
  role: MemberRole;
  tenantId: string;
  workspaceId: string;
  companyId: string;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required in production mode.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.userId !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.tenantId !== "string" ||
      typeof payload.workspaceId !== "string" ||
      typeof payload.companyId !== "string"
    ) {
      return null;
    }
    return {
      email: payload.email,
      name: payload.name,
      userId: payload.userId,
      role: payload.role as MemberRole,
      tenantId: payload.tenantId,
      workspaceId: payload.workspaceId,
      companyId: payload.companyId,
    };
  } catch {
    return null;
  }
}

export function tokenFromCookieHeader(
  raw: string | null | undefined
): string | undefined {
  if (!raw) return undefined;
  const parts = raw.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${SESSION_COOKIE}=`)) continue;
    const value = trimmed.slice(SESSION_COOKIE.length + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

async function readSessionToken(): Promise<string | undefined> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) return token;
  } catch {
    /* cookies() is unavailable in some route-handler contexts */
  }
  try {
    return tokenFromCookieHeader((await headers()).get("cookie"));
  } catch {
    return undefined;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const token = await readSessionToken();
  if (!token) return null;
  return verifySessionToken(token);
}

/** Prefer the incoming Request cookie header (reliable in Route Handlers). */
export async function getSessionFromRequest(
  request: Request
): Promise<SessionPayload | null> {
  const token = tokenFromCookieHeader(request.headers.get("cookie"));
  if (token) {
    const session = await verifySessionToken(token);
    if (session) return session;
  }
  return getSessionFromCookies();
}

export function sessionToScope(session: SessionPayload): TenantScope {
  return {
    tenantId: session.tenantId,
    workspaceId: session.workspaceId,
    companyId: session.companyId,
    ownerUserId: session.userId,
    viewerRole: session.role,
  };
}

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
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

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionToScope(session: SessionPayload): TenantScope {
  return {
    tenantId: session.tenantId,
    workspaceId: session.workspaceId,
    companyId: session.companyId,
  };
}

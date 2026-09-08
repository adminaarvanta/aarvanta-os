import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";

// Stay on middleware.ts. Next 16 proxy.ts broke Vercel production deploys
// (os.aarvanta.co stayed on the last successful middleware build).

const SESSION_COOKIE = "aarvanta_session";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/invite",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/store",
  "/p",
  "/chat",
  "/r",
  "/api/chat",
  "/api/store",
  "/api/auth",
  "/api/affiliate/apply",
  "/api/affiliate/activate",
  "/api/tenant/invitations/accept",
  "/api/webhooks",
  "/api/cron",
  "/api/health",
  "/api/contact",
  // Voice relay (EC2) — routes still require X-Voice-Relay-Secret
  "/api/voice/context",
  "/api/voice/tools",
];

function isLiveDemoPublic(pathname: string) {
  if (process.env.ENABLE_LIVE_DEMO !== "true") return false;
  return pathname === "/demo" || pathname.startsWith("/api/demo/");
}

function isProductionMode() {
  return process.env.APP_MODE === "production";
}

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  // Partner marketing apply + activation (dashboard/admin stay authenticated)
  if (pathname === "/affiliate" || pathname === "/affiliate/") return true;
  if (pathname.startsWith("/affiliate/activate/")) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function sessionTokenFromRequest(request: NextRequest) {
  const fromCookies = request.cookies.get(SESSION_COOKIE)?.value;
  if (fromCookies) return fromCookies;
  const raw = request.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
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

async function hasValidSession(request: NextRequest) {
  const token = sessionTokenFromRequest(request);
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (!isProductionMode()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const hasSession = await hasValidSession(request);

  if (pathname === "/login" && hasSession) {
    const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (isPublicPath(pathname) || isLiveDemoPublic(pathname)) {
    return NextResponse.next();
  }

  if (hasSession) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/login", request.url);
  const returnTo = `${pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", returnTo);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

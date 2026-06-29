import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";

const SESSION_COOKIE = "aarvanta_session";

const PUBLIC_PREFIXES = [
  "/login",
  "/pricing",
  "/about",
  "/contact",
  "/chat",
  "/api/chat",
  "/api/auth",
  "/api/webhooks",
  "/api/health",
  "/api/contact",
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
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
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

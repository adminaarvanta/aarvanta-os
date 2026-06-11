import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "aarvanta_session";

function isProductionMode() {
  return process.env.APP_MODE === "production";
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

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  const needsAuth =
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/crm") ||
    pathname.startsWith("/api/conversations") ||
    pathname.startsWith("/api/contacts") ||
    pathname.startsWith("/api/companies") ||
    pathname.startsWith("/api/pipelines") ||
    pathname.startsWith("/api/deals") ||
    pathname.startsWith("/api/tasks") ||
    pathname.startsWith("/api/activities");

  if (!needsAuth) {
    return NextResponse.next();
  }

  if (await hasValidSession(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/inbox/:path*",
    "/crm/:path*",
    "/api/conversations",
    "/api/conversations/:path*",
    "/api/contacts",
    "/api/contacts/:path*",
    "/api/companies",
    "/api/companies/:path*",
    "/api/pipelines",
    "/api/pipelines/:path*",
    "/api/deals",
    "/api/deals/:path*",
    "/api/tasks",
    "/api/tasks/:path*",
    "/api/activities",
    "/api/activities/:path*",
  ],
};

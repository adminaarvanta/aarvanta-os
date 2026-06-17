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
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/contact") ||
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/chat")
  ) {
    return NextResponse.next();
  }

  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/crm") ||
    pathname.startsWith("/workforce") ||
    pathname.startsWith("/knowledge") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/workflows") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/integrations") ||
    pathname.startsWith("/communications") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/api/conversations") ||
    pathname.startsWith("/api/contacts") ||
    pathname.startsWith("/api/companies") ||
    pathname.startsWith("/api/pipelines") ||
    pathname.startsWith("/api/deals") ||
    pathname.startsWith("/api/tasks") ||
    pathname.startsWith("/api/activities") ||
    pathname.startsWith("/api/workforce") ||
    pathname.startsWith("/api/knowledge") ||
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/workflows") ||
    pathname.startsWith("/api/founder") ||
    pathname.startsWith("/api/tenant") ||
    pathname.startsWith("/api/team") ||
    pathname.startsWith("/api/integrations") ||
    pathname.startsWith("/api/notifications") ||
    pathname.startsWith("/api/analytics");

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
    "/dashboard/:path*",
    "/inbox/:path*",
    "/crm/:path*",
    "/workforce/:path*",
    "/knowledge/:path*",
    "/projects/:path*",
    "/workflows/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/integrations/:path*",
    "/communications/:path*",
    "/analytics/:path*",
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
    "/api/workforce",
    "/api/workforce/:path*",
    "/api/knowledge",
    "/api/knowledge/:path*",
    "/api/projects",
    "/api/projects/:path*",
    "/api/workflows",
    "/api/workflows/:path*",
    "/api/founder",
    "/api/founder/:path*",
    "/api/tenant",
    "/api/tenant/:path*",
    "/api/team",
    "/api/team/:path*",
    "/api/integrations",
    "/api/integrations/:path*",
    "/api/notifications",
    "/api/notifications/:path*",
    "/api/analytics",
    "/api/analytics/:path*",
  ],
};

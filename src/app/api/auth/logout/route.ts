import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth/cookie-options";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(0, req.url),
    maxAge: 0,
  });
  return response;
}

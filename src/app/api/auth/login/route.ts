import { NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";
import { authenticateUser } from "@/lib/auth/credentials";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { assertProductionConfig } from "@/lib/config/app-mode";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { apiError, parseJsonBody } from "@/lib/api/request";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

type LoginInput = z.infer<typeof schema>;

async function parseLoginInput(req: Request): Promise<LoginInput | NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid credentials payload", 400);
    }
    return parsed.data;
  }

  const form = await req.formData();
  const parsed = schema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    next: form.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid credentials payload", 400);
  }
  return parsed.data;
}

function wantsJsonResponse(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  return (
    accept.includes("application/json") &&
    !accept.includes("text/html") &&
    req.headers.get("x-login-mode") === "fetch"
  );
}

function loginErrorRedirect(req: Request, code: string, next?: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", code);
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function POST(req: Request) {
  const input = await parseLoginInput(req);
  if (input instanceof NextResponse) return input;

  const nextPath = sanitizeNextPath(input.next);
  const jsonMode = wantsJsonResponse(req);

  try {
    assertProductionConfig();
    await ensureDatastoreReady();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid production config";
    if (jsonMode) return apiError("MISCONFIGURED", message, 500);
    return loginErrorRedirect(req, "misconfigured", nextPath);
  }

  const session = await authenticateUser(input.email, input.password);
  if (!session) {
    if (jsonMode) {
      return apiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }
    return loginErrorRedirect(req, "invalid_credentials", nextPath);
  }

  const token = await createSessionToken(session);
  const cookieOptions = getSessionCookieOptions(undefined, req.url);

  if (jsonMode) {
    const response = NextResponse.json({ ok: true, next: nextPath });
    response.cookies.set(SESSION_COOKIE, token, cookieOptions);
    return response;
  }

  const response = NextResponse.redirect(new URL(nextPath, req.url));
  response.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return response;
}
